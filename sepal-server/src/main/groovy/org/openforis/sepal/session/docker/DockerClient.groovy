package org.openforis.sepal.session.docker

import groovy.json.JsonOutput
import groovyx.net.http.HttpResponseDecorator
import groovyx.net.http.HttpResponseException
import groovyx.net.http.RESTClient
import org.openforis.sepal.SepalConfiguration
import org.openforis.sepal.SepalWorkingMode
import org.openforis.sepal.instance.Instance
import org.openforis.sepal.session.model.SepalSession
import org.slf4j.Logger
import org.slf4j.LoggerFactory

import static groovyx.net.http.ContentType.JSON
import static org.openforis.sepal.SepalWorkingMode.PRIVATE_LAN
import static org.openforis.sepal.session.model.SessionStatus.ALIVE

interface DockerClient {

    Boolean releaseContainer(SepalSession sandbox)

    Boolean isContainerRunning(SepalSession sandbox)

    SepalSession createContainer(String username, Long userUid, Instance instance)
}

class DockerRESTClient implements DockerClient {
    private static final Logger LOG = LoggerFactory.getLogger(this)
    private static conf = SepalConfiguration.instance

    private final String dockerDaemonURI
    private final SepalWorkingMode workingMode

    DockerRESTClient(String dockerDaemonURI, SepalWorkingMode workingMode) {
        this.dockerDaemonURI = dockerDaemonURI
        this.workingMode = workingMode
    }

    @Override
    SepalSession createContainer(String username, Long userUid, Instance instance) {
        def sandboxData
        LOG.debug("Going to create a container for $username")
        def settings = collectSettings(username)
        def sandboxDockerClient = getRestClient(getInstanceIp(instance))
        def sepalDockerClient = getRestClient()
        def body = new JsonOutput().toJson(
                [
                        Image     : settings.imageName,
                        Tty       : true,
                        Cmd       : ["/start", username, conf.ldapHost, conf.ldapPassword],
                        HostConfig: [Binds: settings.binds]
                ]
        )

        LOG.info("Creating container with: $body")
        try {
            HttpResponseDecorator response = sepalDockerClient.post(
                    path: 'containers/create',
                    requestContentType: JSON,
                    body: body
            ) as HttpResponseDecorator
            sandboxData = new SepalSession(containerId: response.data.Id)
            LOG.debug("Sandbox created: $sandboxData.containerId")
            startContainer(sandboxDockerClient, sandboxData)
            getContainerInfo(sandboxDockerClient, sandboxData)
            exec(sandboxData.containerId,sandboxDockerClient, "/root/healt_check.sh", "$settings.portsToCheck")
        } catch (HttpResponseException exception) {
            LOG.error("Error while creating the sandbox. $exception.response.data")
            throw exception
        }
        return sandboxData
    }


    @Override
    Boolean isContainerRunning(SepalSession data) {
        isContainerRunning(data, getRestClient(getInstanceIp(data?.instance)))
    }


    Boolean isContainerRunning(SepalSession data, RESTClient restClient) {
        try {
            getContainerInfo(restClient, data)
        } catch (Exception ex) {
            LOG.error("Unable to obtain container info for $data.containerId", ex)
        }
        return data.status == ALIVE
    }


    @Override
    Boolean releaseContainer(SepalSession data) {
        releaseContainer(data, getRestClient(data?.instance?.privateIp))
    }

    Boolean releaseContainer(SepalSession data, RESTClient restClient) {
        try {
            if (isContainerRunning(data, restClient)) {
                stopContainer(data.containerId, restClient)
            }
            restClient.delete(path: "containers/$data.containerId")
        } catch (HttpResponseException exception) {
            LOG.error("Error while deleting container $data.containerId", exception)
            throw exception
        }
        return true
    }

    private static Map collectSettings(String username) {
        return [
                portsToCheck: conf.sandboxPortsToCheck,
                binds       : [
                        "$conf.mountingHomeDir/$username:/home/$username",
                        "$conf.publicHomeDir:/sepal/public",
                        "/data/sepal/certificates/ldap-ca.crt.pem:/etc/ldap/certificates/ldap-ca.crt.pem"
                ],
                imageName   : conf.dockerImageName
        ]
    }


    private void startContainer(RESTClient restClient, SepalSession sandbox) {
        def startPath = "containers/$sandbox.containerId/start"
        def body = new JsonOutput().toJson([PublishAllPorts: true])
        try {
            restClient.post(
                    path: startPath,
                    body: body,
                    requestContentType: JSON
            )
        } catch (HttpResponseException exception) {
            LOG.error("Exception while starting the container. Creation will be rollbacked")
            this.releaseContainer(sandbox, restClient)
            throw exception
        }
    }


    private static exec(String sandboxId, RESTClient restClient, String... commands) {
        def path = "containers/$sandboxId/exec"
        def params = [AttachStdin: false, AttachStdout: true, AttachStderr: true, Tty: false, Cmd: commands]
        def jsonParams = new JsonOutput().toJson(params)
        def response = restClient.post(path: path, requestContentType: JSON, body: jsonParams)
        def id = response.data.Id
        path = "exec/$id/start"
        params = [Detach: false, Tty: true]
        jsonParams = new JsonOutput().toJson(params)
        response = restClient.post(path: path, requestContentType: JSON, body: jsonParams)
        return response.data
    }

    private void getContainerInfo(RESTClient restClient, SepalSession containerData) {
        try {
            def path = "containers/$containerData.containerId/json"
            HttpResponseDecorator response = restClient.get(
                    path: path,
            ) as HttpResponseDecorator
            def data = response.data
            containerData.containerURI = response.data.NetworkSettings.IPAddress
            containerData.status = data.State.Running ? ALIVE : STOPPED
        } catch (HttpResponseException responseException) {
            LOG.error("Error while getting container info. $responseException.message")
            throw responseException
        }
    }


    private static void stopContainer(String containerId, RESTClient restClient) {
        def path = "containers/$containerId/stop"
        try {
            restClient.post(path: path)
        } catch (HttpResponseException ex) {
            LOG.error("Error while stopping container $containerId", ex)
            throw ex
        }
    }

    private String getInstanceIp(Instance instance) {
        return workingMode == PRIVATE_LAN ? instance?.privateIp : instance?.publicIp
    }

    private RESTClient getRestClient(String baseURI = dockerDaemonURI) {
        new RESTClient(SepalConfiguration.instance.getDockerDaemonURI(baseURI))
    }

}
