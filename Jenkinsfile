pipeline {
  agent any

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('SAST - Semgrep') {
      steps {
        sh '''
        docker run --rm \
          -v "$PWD/app:/src" \
          returntocorp/semgrep \
          semgrep --config=auto /src
        '''
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t vuln-app .'
      }
    }

    stage('Run App') {
      steps {
        sh '''
        docker run -d --name vuln-app-demo -p 3000:3000 vuln-app
        '''
      }
    }

    stage('DAST - OWASP ZAP') {
      steps {
        sh '''
        docker run --rm \
          --network host \
          zaproxy/zap-stable \
          zap-baseline.py \
          -t http://localhost:3000 \
          -r zap-report.html
        '''
      }
    }
  }

  post {
    always {
      sh 'docker rm -f vuln-app-demo || true'
      archiveArtifacts artifacts: '*.html', fingerprint: true
    }
  }
}
