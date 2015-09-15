#!/usr/bin/env bash

apt-get update && apt-get install -y curl wget php5-mcrypt openssh-server supervisor libssh2-1-dev libssh2-php php5-curl php5-gd php5-mysql
wget -O "sepal-php.tar.gz"  "http://openforis.org/nexus/service/local/artifact/maven/redirect?r=public&g=org.openforis.sepal&a=sepal-php&v=1.0.0-SNAPSHOT&e=tgz"
tar -zxvf sepal-php.tar.gz -C /var/www/html/
chown -R www-data:www-data /var/www/html
chmod 775 /var/www/html/app/config/lsat_geoserver_fix.sh
chmod -R 775 /var/www/html/app/config/processing-scripts/

php5enmod mcrypt
a2enmod rewrite
a2enmod ssl
useradd sdms-admin -d "/data/home/sdms-admin"
echo sdms-admin:sdms-admin | chpasswd
groupadd -g 9999 sepal
usermod -aG sepal www-data
mkdir /var/run/sshd
