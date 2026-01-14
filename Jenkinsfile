pipeline {
    agent any

    stages {
        stage('Install Requirements') {
            steps {
                echo '--- Installing Dependencies ---'
                sh 'pip3 install -r requirements.txt --break-system-packages || pip3 install -r requirements.txt'
            }
        }

        stage('SAST - Bandit Scan') {
            steps {
                echo '--- Running SAST ---'
                // ||true để pipeline không dừng lại dù tìm thấy lỗi
                sh 'bandit -r web.py -f json -o bandit_report.json || true'
            }
        }

        stage('Start Web App') {
            steps {
                echo '--- Starting Web App in Background ---'
                // Chạy app ẩn (background) và lưu log ra file
                sh 'nohup python3 web.py > app.log 2>&1 &'
                // Đợi 5 giây để server khởi động xong
                sleep 5
            }
        }

        stage('DAST - OWASP ZAP') {
            steps {
                echo '--- Running DAST ---'
                script {
                    // Dùng 'host.docker.internal' để container ZAP gọi được về WSL host
                    def target = "http://host.docker.internal:5005"
                    
                    try {
                        sh "docker run --rm -v \$(pwd):/zap/wrk:rw -u 0 zaproxy/zap-stable zap-baseline.py -t ${target} -r zap_report.html"
                    } catch (Exception e) {
                        echo 'ZAP found security issues (Expected)'
                    }
                }
            }
        }
    }

    // Dọn dẹp sau khi chạy xong
    post {
        always {
            echo '--- Cleaning Up ---'
            // 1. Tắt Web App
            sh 'pkill -f "python3 web.py" || true'
            // 2. Lưu lại báo cáo xem
            archiveArtifacts artifacts: 'bandit_report.json, zap_report.html', allowEmptyArchive: true
        }
    }
}