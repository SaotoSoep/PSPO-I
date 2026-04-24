# PSPO I Exam Practice

Een exam-like oefenwebsite voor PSPO I.

## Wat je krijgt

- 80 unieke vragen in de database
- Elke examensessie kiest 80 willekeurige vragen
- 60 minuten per examen
- Pass score van 85%
- Review na afloop met jouw antwoord, het juiste antwoord en feedback

## Bestanden

- `PSPO-I_SaotoSoep.html`
- `index.html` gebruikt een redirect naar de quizpagina
- `css/styles.css`
- `js/questions.js`
- `js/extraQuestions.js`
- `js/app.js`
- `scripts/check-question-bank.mjs`
- `Scrum Product Owner Sample Exam Questions.pdf`

## Bronnen

- Scrum Product Owner sample exam PDF
- `ChatGPT_pspo_160_scenario_questions.docx`
- Mikhail Lapshin PSPO I learning-mode quiz als externe inhoudelijke referentie voor extra originele vragen

## Lokaal draaien

Open `PSPO-I_SaotoSoep.html` in een browser of serveer de map via een eenvoudige static server.

## Opmerking

De quiz kiest bij elke nieuwe start een nieuwe willekeurige selectie van 80 vragen uit de volledige database.

Gebruik `node scripts/check-question-bank.mjs` om nieuwe importbestanden te controleren op exacte of bijna-dubbele vragen voordat je ze toevoegt.
