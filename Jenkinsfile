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

        stage('Set Dynamic Port & Create .env') {
            steps {
                sh '''
                NEXT=$(cat next_env)

                # Assign ports dynamically for blue/green environments
                if [ "$NEXT" = "blue" ]; then
                    PORT=9001
                else
                    PORT=9000
                fi

                cat <<EOF > .env
PORT=${PORT}
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

                echo "Deploying $NEXT environment on port $PORT"
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

                # Start DB container (persistent volume ensures data is safe)
                docker-compose -f docker-compose.yml up -d db
                '''
            }
        }

        stage('Build New Backend') {
            steps {
                sh '''
                NEXT=$(cat next_env)

                # Build backend image
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_$NEXT build backend
                '''
            }
        }

        stage('Start New Backend') {
            steps {
                sh '''
                NEXT=$(cat next_env)

                # Remove any existing backend container to avoid ContainerConfig errors
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_$NEXT rm -fs backend || true

                # Start backend container
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_$NEXT up -d backend
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                NEXT=$(cat next_env)
                PORT=$(grep ^PORT .env | cut -d '=' -f2)

                sleep 5
                echo "Checking health on port $PORT"

                # Health check endpoint
                curl -f http://localhost:${PORT}/health || exit 1

                # List backend container to verify
                docker ps | grep ${COMPOSE_PROJECT_NAME}_$NEXT
                '''
            }
        }

        stage('Stop Old Backend') {
            steps {
                sh '''
                CURRENT=$(cat current_env)

                # Stop old environment backend container
                docker-compose -f docker-compose.yml -f docker-compose.backend.yml -p ${COMPOSE_PROJECT_NAME}_$CURRENT down backend || true
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
