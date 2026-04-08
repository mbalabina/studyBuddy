#!/bin/bash
BASE="http://localhost:3000/api/trpc"

echo "1. Регистрируем Alice..."
curl -s -X POST $BASE/auth.register -H "Content-Type: application/json" -d '{"json": {"email": "alice@test.com", "password": "test123"}}' > /dev/null

echo "2. Регистрируем Bob..."
curl -s -X POST $BASE/auth.register -H "Content-Type: application/json" -d '{"json": {"email": "bob@test.com", "password": "test123"}}' > /dev/null

echo "3. Логинимся за Alice..."
curl -s -X POST $BASE/auth.login -H "Content-Type: application/json" -c /tmp/alice.txt -d '{"json": {"email": "alice@test.com", "password": "test123"}}' > /dev/null

echo "4. Логинимся за Bob..."
curl -s -X POST $BASE/auth.login -H "Content-Type: application/json" -c /tmp/bob.txt -d '{"json": {"email": "bob@test.com", "password": "test123"}}' > /dev/null

echo "5. Профиль Alice..."
curl -s -X POST $BASE/profile.updateAboutMe -H "Content-Type: application/json" -b /tmp/alice.txt -d '{"json": {"firstName": "Alice", "age": 25, "city": "Moscow", "studyGoal": "Хочу подготовиться к IELTS и уехать в Канаду", "proficiencyLevel": "Intermediate", "subjects": ["English","IELTS"], "schedule": ["Вечер","Выходные"], "learningFormat": "Online", "communicationStyle": "Friendly"}}' > /dev/null

echo "6. Предпочтения Alice..."
curl -s -X POST $BASE/profile.updatePartnerPreferences -H "Content-Type: application/json" -b /tmp/alice.txt -d '{"json": {"preferredLevel": "Intermediate", "preferredSchedule": ["Вечер"], "learningFormat": "Online", "communicationStyle": "Friendly", "city": "Moscow"}}' > /dev/null

echo "7. Профиль Bob..."
curl -s -X POST $BASE/profile.updateAboutMe -H "Content-Type: application/json" -b /tmp/bob.txt -d '{"json": {"firstName": "Bob", "age": 27, "city": "Moscow", "studyGoal": "Готовлюсь к IELTS для поступления в зарубежный вуз", "proficiencyLevel": "Intermediate", "subjects": ["English","IELTS"], "schedule": ["Вечер","Утро"], "learningFormat": "Online", "communicationStyle": "Friendly"}}' > /dev/null

echo "8. Предпочтения Bob..."
curl -s -X POST $BASE/profile.updatePartnerPreferences -H "Content-Type: application/json" -b /tmp/bob.txt -d '{"json": {"preferredLevel": "Intermediate", "preferredSchedule": ["Вечер"], "learningFormat": "Online", "communicationStyle": "Friendly", "city": "Moscow"}}' > /dev/null

echo ""
echo "9. Проверяем матчинг..."
curl -s "$BASE/matching.getCandidates?input=%7B%22json%22%3A%7B%7D%7D" -b /tmp/alice.txt | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data.get('result', {}).get('data', {}).get('json', [])
if not items:
    print('Кандидаты не найдены')
else:
    for c in items:
        print(f\"Имя: {c['name']}\")
        print(f\"Совместимость: {c['compatibility']}%\")
        print(f\"Цель: {c['goal']}\")
        print(f\"Формат: {c['learningFormat']}\")
"
