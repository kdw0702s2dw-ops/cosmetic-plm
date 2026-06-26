# Build Fix: duplicate copilotCommand

이 패키지는 Final Sprint C+D+E 적용 후 발생한 아래 빌드 오류를 수정합니다.

- the name `copilotCommand` is defined multiple times
- the name `setCopilotCommand` is defined multiple times

적용 방법:
1. 압축 해제
2. cosmetic-plm-web 폴더에 그대로 덮어쓰기
3. npm run build
4. git add .
5. git commit -m "fix duplicate copilot command build error"
6. git push
