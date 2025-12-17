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
            steps {
                git branch: "${GIT_BRANCH}", url: "${GIT_REPO}"
            }
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
JWT_SECRET=6c1f9f0f7493d9cba76b7d8fc08b4f13227c4c19d2c71486d42a47c6b83c9d937c9a2dba9ea1d74fa85bb39b6e2a3d1beaf331b8589c9d3bc0c5c447e8e08de7
RAZORPAY_KEY_ID=rzp_test_RB6geQZM7LSjyd
RAZORPAY_KEY_SECRET=1PwTJ0gYwaCINkHHyC1AocQ5
NODE_ENV=production
EOF
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
        success {
            echo '✅ LMS Backend deployed successfully (Zero-downtime)'
        }
        failure {
            echo '❌ Deployment failed — old version still running'
        }
    }
}
