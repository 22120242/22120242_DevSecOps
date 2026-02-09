pipeline {
    agent any

    environment {
        // Dùng đúng tên image python bạn đang có
        APP_IMAGE = "my-vulnerable-app"
        CONTAINER_NAME = "devsecops-demo-app"
        NETWORK_NAME = "devsecops-net"
    }

    stages {
        stage('Check Info') {
            steps {
                // Kiểm tra xem Jenkins đã gọi được Docker chưa
                sh 'docker --version'
                sh 'id' // Kiểm tra xem có phải đang chạy user root không
            }
        }

        stage('SAST - Static Analysis') {
            steps {
                echo 'Running SAST with Bandit...'
                // Cài bandit
                sh 'pip install bandit' 
                // Quét code, bỏ qua lỗi (|| true) để demo chạy tiếp
                sh 'bandit -r . -f json -o bandit_report.json || true' 
            }
            post {
                always {
                    archiveArtifacts artifacts: 'bandit_report.json', allowEmptyArchive: true
                }
            }
        }

        stage('Build & Run App') {
            steps {
                script {
                    sh "docker network create ${NETWORK_NAME} || true"
                    // Build từ Dockerfile (sẽ dùng python:3.9-slim bạn đã có)
                    sh "docker build -t ${APP_IMAGE} ."
                    sh "docker rm -f ${CONTAINER_NAME} || true"
                    sh "docker run -d --name ${CONTAINER_NAME} --network ${NETWORK_NAME} ${APP_IMAGE}"
                    sh "sleep 5" 
                }
            }
        }

        stage('DAST - Dynamic Analysis') {
            steps {
                echo 'Running DAST with ZAP...'
                script {
                    // QUAN TRỌNG: Đã sửa tên image thành 'zaproxy/zap-stable' khớp với máy bạn
                    sh """
                        docker run --rm --network ${NETWORK_NAME} \
                        -v \$(pwd):/zap/wrk/:rw \
                        -t aproxy/zap-stable zap-baseline.py \
                        -t http://${CONTAINER_NAME}:5000 \
                        -r zap_report.html || true
                    """
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'zap_report.html', allowEmptyArchive: true
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up...'
            sh "docker rm -f ${CONTAINER_NAME} || true"
            sh "docker network rm ${NETWORK_NAME} || true"
        }
    }
}