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

        stage('Deploy Blue on 9001') {
            steps {
                sh '''
                echo blue > next_env
                echo green > current_env

                cat <<EOF > .env
PORT=9001
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

                docker-compose -f docker-compose.yml up -d db

                docker-compose \
                  -f docker-compose.yml \
                  -f docker-compose.backend.yml \
                  -p ${COMPOSE_PROJECT_NAME}_blue \
                  build backend

                docker-compose \
                  -f docker-compose.yml \
                  -f docker-compose.backend.yml \
                  -p ${COMPOSE_PROJECT_NAME}_blue \
                  up -d backend
                '''
            }
        }

        stage('Stop Old Backend') {
            steps {
                sh '''
                docker rm -f xpress_backend || true
                docker rm -f ${COMPOSE_PROJECT_NAME}_green_backend || true
                '''
            }
        }

        stage('Re-map Blue to 9000 (Production)') {
            steps {
                sh '''
                docker-compose \
                  -f docker-compose.yml \
                  -f docker-compose.backend.yml \
                  -p ${COMPOSE_PROJECT_NAME}_blue \
                  down

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

                docker-compose \
                  -f docker-compose.yml \
                  -f docker-compose.backend.yml \
                  -p ${COMPOSE_PROJECT_NAME}_blue \
                  up -d backend
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Blue deployed and mapped to port 9000 (Zero-downtime)'
        }
        failure {
            echo '❌ Deployment failed'
        }
    }
}
