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
PORT=9000
DB_NAME=lmsmcdb
DB_USER=postgres
DB_PASS=postgres
DB_HOST=db
DB_DIALECT=postgres
DB_PORT=5432
JWT_SECRET=your_jwt_secret_here
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
NODE_ENV=production
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
            echo '✅ Backend running on port 9000'
        }
        failure {
            echo '❌ Deployment failed'
        }
    }
}
