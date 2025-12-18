pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "lms_backend"
        GIT_REPO   = "https://github.com/haritechy/LMSMC_backend_2.git"
        GIT_BRANCH = "lmsproduction"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO}"
            }
        }

        stage('Create ENV') {
            steps {
                sh '''
                cat <<EOF > .env
# App
PORT=9000
NODE_ENV=production

DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
DB_HOST=${DB_HOST}
DB_DIALECT=${DB_DIALECT}
DB_PORT=${DB_PORT}

JWT_SECRET=${JWT_SECRET}

RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}

GOOGLE_PROJECT_ID=${GOOGLE_PROJECT_ID}
GOOGLE_PRIVATE_KEY_ID=${GOOGLE_PRIVATE_KEY_ID}
GOOGLE_PRIVATE_KEY=${GOOGLE_PRIVATE_KEY}
GOOGLE_CLIENT_EMAIL=${GOOGLE_CLIENT_EMAIL}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_AUTH_URI=${GOOGLE_AUTH_URI}
GOOGLE_TOKEN_URI=${GOOGLE_TOKEN_URI}
GOOGLE_CERT_URL=${GOOGLE_CERT_URL}
GOOGLE_CLIENT_CERT_URL=${GOOGLE_CLIENT_CERT_URL}
GOOGLE_SHARED_EMAIL=${GOOGLE_SHARED_EMAIL}

AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_REGION=${AWS_REGION}
AWS_S3_BUCKET_NAME=${AWS_S3_BUCKET_NAME}
EOF
                '''
            }
        }

        stage('Start DB') {
            steps {
                sh 'docker-compose -f docker-compose.yml up -d db'
            }
        }

        stage('Deploy Backend') {
            steps {
                sh '''
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml down --remove-orphans || true
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml build backend
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml up -d backend
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Backend deployed'
        }
        failure {
            echo '❌ Backend deployment failed'
            echo '❌ Backend deployment failed'
        }
    }
}
