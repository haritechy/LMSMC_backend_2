pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = "lms_backend"
        GIT_REPO = "https://github.com/haritechy/LMSMC_backend_2.git"
        GIT_BRANCH = "lmsproduction"
        APP_PORT = "9000"
    }

    stages {
        stage('Checkout Code') {
            steps { git branch: "${GIT_BRANCH}", url: "${GIT_REPO}" }
        }

        stage('Create .env') {
            steps {
                sh '''
                cat <<EOF > .env
PORT=${APP_PORT}
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

        stage('Ensure DB Running') {
            steps {
                sh '''
                # Remove old DB container if exists
                if [ "$(docker ps -a -q -f name=postgres_db)" ]; then
                    docker rm -f postgres_db
                fi
                docker-compose -f docker-compose.yml up -d db
                '''
            }
        }

        stage('Detect Active Environment') {
            steps {
                sh '''
                if docker ps --format '{{.Names}}' | grep -q ${COMPOSE_PROJECT_NAME}_blue_backend; then
                    echo blue > current_env
                    echo green > next_env
                else
                    echo green > current_env
                    echo blue > next_env
                fi
                '''
            }
        }

        stage('Build New Backend') {
            steps {
                sh '''
                NEXT=$(cat next_env)
                docker-compose -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_$NEXT build backend
                '''
            }
        }

        stage('Start New Backend') {
            steps {
                sh '''
                NEXT=$(cat next_env)
                docker-compose -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_$NEXT up -d backend
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                NEXT=$(cat next_env)
                sleep 5
                curl -f http://localhost:${APP_PORT}/health || exit 1
                docker ps | grep ${COMPOSE_PROJECT_NAME}_$NEXT
                '''
            }
        }

        stage('Stop Old Backend') {
            steps {
                sh '''
                CURRENT=$(cat current_env)
                docker-compose -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_$CURRENT down backend || true
                '''
            }
        }
    }

    post {
        success { echo '✅ LMS Backend deployed successfully (Zero-downtime)' }
        failure { echo '❌ Deployment failed — old version still running' }
    }
}
