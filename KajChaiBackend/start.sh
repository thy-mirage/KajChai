#!/bin/bash
java -Dserver.port=$PORT -Dspring.profiles.active=production -jar target/*.jar