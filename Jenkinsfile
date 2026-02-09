pipeline {
    agent any

    environment {
        DOCKER_USER = '22120242' 
        
        IMAGE_NAME = 'devsecops'
        
        FULL_IMAGE = "${DOCKER_USER}/${IMAGE_NAME}:v${BUILD_NUMBER}" 
        
        CONTAINER_NAME = "devsecops-container"
        NETWORK_NAME = "cicd-net"
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Nếu bạn cấu hình "Pipeline from SCM" thì bước này tự động.
                // Nếu chạy "Pipeline script", bạn cần git url:
                git branch: 'main', url: 'https://github.com/TênGitHubCủaBạn/TênRepo.git'
            }
        }

        stage('SAST - Security Scan') {
            steps {
                echo '=== Running Bandit Scan ==='
                sh 'pip install bandit'
                // || true để không dừng pipeline nếu có lỗi (để demo chạy tiếp)
                sh 'bandit -r . -f json -o bandit_report.json || true'
            }
        }

        stage('Build Image') {
            steps {
                echo '=== Building Docker Image ==='
                script {
                    sh "docker build -t ${FULL_IMAGE} ."
                }
            }
        }

        stage('DAST - Runtime Scan') {
            steps {
                echo '=== Running OWASP ZAP ==='
                script {
                    // 1. Tạo mạng
                    sh "docker network create ${NETWORK_NAME} || true"
                    
                    // 2. Chạy App cần test
                    sh "docker run -d --rm --name ${CONTAINER_NAME} --network ${NETWORK_NAME} ${FULL_IMAGE}"
                    sh "sleep 5" // Đợi app khởi động
                    
                    // 3. Chạy ZAP Scan
                    // Lưu ý: Dùng image bạn đã có: zaproxy/zap-stable
                    sh """
                        docker run --rm --network ${NETWORK_NAME} \
                        -v \$(pwd):/zap/wrk/:rw \
                        -t zaproxy/zap-stable zap-baseline.py \
                        -t http://${CONTAINER_NAME}:5000 \
                        -r zap_report.html || true
                    """
                    
                    // 4. Tắt App sau khi scan xong
                    sh "docker stop ${CONTAINER_NAME}"
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                echo '=== Pushing to Docker Registry ==='
                // Sử dụng credentials ID đã tạo ở Bước 1
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    script {
                        // Đăng nhập an toàn (không lộ pass trong log)
                        sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                        
                        // Push image lên DockerHub
                        sh "docker push ${FULL_IMAGE}"
                        
                        // Push thêm tag 'latest' (tùy chọn)
                        sh "docker tag ${FULL_IMAGE} ${DOCKER_USER}/${IMAGE_NAME}:latest"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:latest"
                    }
                }
            }
        }
    }

    post {
        always {
            // Dọn dẹp sau khi chạy xong
            echo 'Cleaning up workspace...'
            sh "docker network rm ${NETWORK_NAME} || true"
            sh "docker logout"
            // Lưu lại báo cáo
            archiveArtifacts artifacts: 'bandit_report.json, zap_report.html', allowEmptyArchive: true
        }
    }
}