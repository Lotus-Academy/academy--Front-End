pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "lotus-frontend:latest"
        REPO_URL = "git@github.com:Lotus-Academy/academy--Front-End.git"
        BRANCH = "main"
        SSH_CREDENTIAL_ID = "git-new"
    }

    triggers {
        githubPush()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout([$class: 'GitSCM',
                    branches: [[name: "*/${BRANCH}"]],
                    userRemoteConfigs: [[
                        url: "${REPO_URL}",
                        credentialsId: "${SSH_CREDENTIAL_ID}"
                    ]],
                    extensions: [
                        [$class: 'CleanBeforeCheckout'],  
                        [$class: 'CloneOption', noTags: false, shallow: false, depth: 0]
                    ]
                ])
            }
        }

        stage('Build Docker Image') {
            steps {
                dir("$WORKSPACE") {
                    sh "docker build -t ${DOCKER_IMAGE} ."
                }
            }
        }

        stage('Deploy Container') {
            steps {
                sh '''
                    docker stop frontend-container || true
                    docker rm frontend-container || true
                    docker run -d -p 80:80 --name frontend-container lotus-frontend:latest
                '''
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline terminé avec succès !"
        }
        failure {
            echo "❌ Pipeline échoué ! Vérifie les logs."
        }
    }
}
