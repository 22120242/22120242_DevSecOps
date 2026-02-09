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
        echo "Workspace is: $WORKSPACE"
        ls -la $WORKSPACE/app

        docker run --rm \
        -v "$WORKSPACE:/src:ro" \
        returntocorp/semgrep \
        semgrep --config=auto --json --output=/tmp/semgrep-report.json /src/app || true
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
        
        echo "Waiting for app to be ready..."
        sleep 5
        
        # Health check
        for i in {1..10}; do
          if curl -f http://localhost:3000/search?q=test > /dev/null 2>&1; then
            echo "App is ready!"
            break
          fi
          echo "Waiting for app... ($i/10)"
          sleep 2
        done
        '''
      }
    }

    stage('DAST - OWASP ZAP') {
      steps {
        sh '''
        docker run --rm \
          --network host \
          -v "$WORKSPACE:/zap/wrk:rw" \
          -u zap \
          zaproxy/zap-stable \
          zap-baseline.py \
          -t http://localhost:3000 \
          -r zap-report.html \
          -w /zap/wrk/zap-report.md || true
        
        # Copy report if it exists
        if [ -f "$WORKSPACE/zap-report.html" ]; then
          echo "ZAP report generated successfully"
        else
          echo "Warning: ZAP report not found"
        fi
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
