package org.openforis.sepal.component.sandboxmanager.command

import org.openforis.sepal.command.AbstractCommand
import org.openforis.sepal.command.CommandHandler
import org.openforis.sepal.component.sandboxmanager.SessionManager

class DeployStartingSessions extends AbstractCommand<Void> {

}

class DeployStartingSessionsHandler implements CommandHandler<Void, DeployStartingSessions> {
    private final SessionManager sessionManager

    DeployStartingSessionsHandler(SessionManager sessionManager) {
        this.sessionManager = sessionManager
    }

    Void execute(DeployStartingSessions command) {
        sessionManager.deployStartingSessions()
        return null
    }
}
