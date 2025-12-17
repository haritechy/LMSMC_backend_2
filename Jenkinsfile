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
                echo "Deploying BLUE on port 9001"

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

                # Ensure DB is running
                docker-compose -f docker-compose.yml up -d db

                # FULL cleanup to avoid ContainerConfig error
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_blue down --remove-orphans || true
                docker image rm ${COMPOSE_PROJECT_NAME}_blue_backend:latest || true

                # Build and start BLUE
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_blue build backend
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_blue up -d backend
                '''
            }
        }

        stage('Stop Old Backend (9000)') {
            steps {
                sh '''
                echo "Stopping old production backend"

                docker rm -f xpress_backend || true
                docker rm -f ${COMPOSE_PROJECT_NAME}_green_backend || true
                '''
            }
        }

        stage('Re-map Blue to 9000 (Production)') {
            steps {
                sh '''
                echo "Re-mapping BLUE to port 9000"

                # Stop blue on 9001
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_blue down

                # Create production .env
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

                # Start BLUE on 9000
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_blue up -d backend
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Blue deployed and running on port 9000 (Production)'
        }
        failure {
            echo '❌ Deployment failed'
        }
    }
}
