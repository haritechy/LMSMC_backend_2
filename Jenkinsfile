pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "lms_backend"
        GIT_REPO = "https://github.com/haritechy/LMSMC_backend_2.git"
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

# Database
DB_NAME=lmsmcdb
DB_USER=postgres
DB_PASS=postgres
DB_HOST=db
DB_DIALECT=postgres
DB_PORT=5432

# Auth
JWT_SECRET=6c1f9f0f7493d9cba76b7d8fc08b4f13227c4c19d2c71486d42a47c6b83c9d937c9a2dba9ea1d74fa85bb39b6e2a3d1beaf331b8589c9d3bc0c5c447e8e08de7

# Razorpay
RAZORPAY_KEY_ID=rzp_test_RB6geQZM7LSjyd
RAZORPAY_KEY_SECRET=1PwTJ0gYwaCINkHHyC1AocQ5

# Google Service Account (Calendar / Meet)
GOOGLE_PROJECT_ID=lmsmusical
GOOGLE_PRIVATE_KEY_ID=xxxx
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nXXXX\\n-----END PRIVATE KEY-----\\n"
GOOGLE_CLIENT_EMAIL=lms-539@lmsmusical.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=xxxx
GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/lms-539%40lmsmusical.iam.gserviceaccount.com
GOOGLE_SHARED_EMAIL=lms@techfreak.info
EOF
                '''
            }
        }

        stage('Start DB') {
            steps {
                sh '''
                docker-compose -f docker-compose.yml up -d db
                '''
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
            echo '✅ Backend successfully deployed on port 9000'
        }
        failure {
            echo '❌ Backend deployment failed'
        }
    }
}
