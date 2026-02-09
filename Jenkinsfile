pipeline {
    agent any

    environment {
        // Thông tin cấu hình
        DOCKER_USER = '22120242' 
        IMAGE_NAME = 'devsecops'
        FULL_IMAGE = "${DOCKER_USER}/${IMAGE_NAME}:v${BUILD_NUMBER}" 
        
        CONTAINER_NAME = "devsecops-container"
        NETWORK_NAME = "cicd-net"
    }

    stages {
        // KHÔNG CẦN stage('Checkout Code') vì Jenkins đã tự làm việc này

        stage('SAST - Security Scan') {
            steps {
                echo '=== Running Bandit Scan ==='
                // Cài đặt và quét
                sh 'pip install bandit'
                // || true để pipeline không dừng nếu phát hiện lỗi (để chạy tiếp demo)
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
                    // 1. Tạo mạng để các container nhìn thấy nhau
                    sh "docker network create ${NETWORK_NAME} || true"
                    
                    // 2. Chạy ứng dụng web (Target)
                    sh "docker run -d --rm --name ${CONTAINER_NAME} --network ${NETWORK_NAME} ${FULL_IMAGE}"
                    
                    // Đợi 5s cho app khởi động xong
                    sh "sleep 5" 
                    
                    // 3. Chạy ZAP để tấn công thử
                    // Lưu ý: Dùng image ZAP có sẵn trên máy bạn
                    sh """
                        docker run --rm --network ${NETWORK_NAME} \
                        -v \$(pwd):/zap/wrk/:rw \
                        -t zaproxy/zap-stable zap-baseline.py \
                        -t http://${CONTAINER_NAME}:5000 \
                        -r zap_report.html || true
                    """
                    
                    // 4. Tắt ứng dụng sau khi scan xong
                    sh "docker stop ${CONTAINER_NAME}"
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                echo '=== Pushing to Docker Registry ==='
                // YÊU CẦU: Phải tạo Credentials ID là 'dockerhub-creds' trên Jenkins trước
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    script {
                        // Đăng nhập
                        sh "echo \$DOCKER_PASS | docker login -u \$DOCKER_USER --password-stdin"
                        
                        // Push image version hiện tại
                        sh "docker push ${FULL_IMAGE}"
                        
                        // (Tùy chọn) Push thêm tag latest
                        sh "docker tag ${FULL_IMAGE} ${DOCKER_USER}/${IMAGE_NAME}:latest"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:latest"
                    }
                }
            }
        }
    }

    post {
        always {
            echo '=== Cleaning up ==='
            // Dọn dẹp mạng và logout
            sh "docker network rm ${NETWORK_NAME} || true"
            sh "docker logout"
            
            // Lưu lại báo cáo để xem trên Jenkins
            archiveArtifacts artifacts: 'bandit_report.json, zap_report.html', allowEmptyArchive: true
        }
    }
}