let quizData = [];
let currentQuiz = 0;
let score = 0;
let streak = 0;

const MAX_TIME = 15;
const RING_CIRCUMFERENCE = 175.93; // 2 * PI * 28 (matches SVG radius in CSS)

let timerCount = MAX_TIME;
let timerInterval;
let selectedAnswer = null;

const questionEl = document.getElementById('question');
const textA = document.getElementById('text-a');
const textB = document.getElementById('text-b');
const textC = document.getElementById('text-c');
const textD = document.getElementById('text-d');
const timerEl = document.getElementById('timer');
const timerRing = document.getElementById('timer-ring');
const ringFg = document.getElementById('ring-fg');
const dotsContainer = document.getElementById('dots');
const qCurrentEl = document.getElementById('q-current');
const qTotalEl = document.getElementById('q-total');
const scoreCountEl = document.getElementById('score-count');
const streakCountEl = document.getElementById('streak-count');
const streakPill = document.getElementById('streak-pill');
const nextBtn = document.getElementById('next-btn');
const optionButtons = document.querySelectorAll('.option-btn');

async function startQuizApp() {
    try {
        const response = await fetch('get_questions.php', {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!response.ok) throw new Error("Security block or file not found.");

        quizData = await response.json();

        if (quizData.length > 0) {
            buildDots();
            qTotalEl.innerText = quizData.length;
            loadQuiz();
        } else {
            questionEl.innerText = "No questions found in the database, yawr!";
        }
    } catch (error) {
        questionEl.innerText = "Failed to load quiz. Make sure you're running this via localhost!";
        console.error(error);
    }
}

function buildDots() {
    dotsContainer.innerHTML = '';
    quizData.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.id = `dot-${i}`;
        dotsContainer.appendChild(dot);
    });
}

function updateDots() {
    quizData.forEach((_, i) => {
        const dot = document.getElementById(`dot-${i}`);
        if (!dot) return;
        dot.classList.remove('active', 'done');
        if (i < currentQuiz) dot.classList.add('done');
        if (i === currentQuiz) dot.classList.add('active');
    });
}

function loadQuiz() {
    resetOptions();
    clearInterval(timerInterval);
    startTimer();

    selectedAnswer = null;
    nextBtn.disabled = true;

    qCurrentEl.innerText = currentQuiz + 1;
    updateDots();

    const currentQuizData = quizData[currentQuiz];
    questionEl.innerText = currentQuizData.question;
    textA.innerText = currentQuizData.a;
    textB.innerText = currentQuizData.b;
    textC.innerText = currentQuizData.c;
    textD.innerText = currentQuizData.d;
}

function resetOptions() {
    optionButtons.forEach(btn => {
        btn.classList.remove('correct', 'wrong');
        btn.style.pointerEvents = 'auto';
    });
}

function startTimer() {
    timerCount = MAX_TIME;
    timerEl.innerText = timerCount;
    timerRing.classList.remove('low');
    ringFg.style.strokeDashoffset = 0;

    timerInterval = setInterval(() => {
        timerCount--;
        timerEl.innerText = timerCount;

        const offset = RING_CIRCUMFERENCE * (1 - timerCount / MAX_TIME);
        ringFg.style.strokeDashoffset = offset;

        if (timerCount <= 5) {
            timerRing.classList.add('low');
        }

        if (timerCount <= 0) {
            clearInterval(timerInterval);
            streak = 0;
            updateStreakUI();
            revealCorrectAnswer();
            nextBtn.disabled = false;
        }
    }, 1000);
}

function selectOption(choice) {
    clearInterval(timerInterval);
    selectedAnswer = choice;
    const correctAnswer = quizData[currentQuiz].correct;

    optionButtons.forEach(btn => btn.style.pointerEvents = 'none');

    const alphabetIndex = ['a', 'b', 'c', 'd'].indexOf(choice);
    const clickedBtn = optionButtons[alphabetIndex];

    if (choice === correctAnswer) {
        clickedBtn.classList.add('correct');
        score++;
        streak++;
        updateScoreUI();
        updateStreakUI(true);
    } else {
        clickedBtn.classList.add('wrong');
        streak = 0;
        updateStreakUI();
        revealCorrectAnswer();
    }

    nextBtn.disabled = false;
}

function updateScoreUI() {
    scoreCountEl.innerText = score;
}

function updateStreakUI(bump = false) {
    streakCountEl.innerText = streak;
    if (bump) {
        streakPill.classList.remove('bump');
        // restart animation
        void streakPill.offsetWidth;
        streakPill.classList.add('bump');
    }
}

function revealCorrectAnswer() {
    const correctAnswer = quizData[currentQuiz].correct;
    const alphabetIndex = ['a', 'b', 'c', 'd'].indexOf(correctAnswer);
    optionButtons[alphabetIndex].classList.add('correct');
    optionButtons.forEach(btn => btn.style.pointerEvents = 'none');
}

function loadNextQuestion() {
    currentQuiz++;

    if (currentQuiz < quizData.length) {
        loadQuiz();
    } else {
        clearInterval(timerInterval);
        updateDots();

        let username = prompt("Quiz Finished! Enter your name for the leaderboard:");
        if (!username || !username.trim()) username = "Anonymous";

        fetch('save_score.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ username: username.trim(), score: score })
        })
        .then(res => res.json())
        .then(leaderboard => {
            showLeaderboard(leaderboard);
        })
        .catch(() => {
            showLeaderboard([]);
        });
    }
}

function showLeaderboard(leaderboard) {
    const totalQuestions = quizData.length;
    const medals = ['gold', 'silver', 'bronze'];

    let rowsHTML = '';
    leaderboard.forEach((player, index) => {
        const rankClass = medals[index] || '';
        rowsHTML += `
            <tr>
                <td><span class="rank-badge ${rankClass}">${index + 1}</span></td>
                <td>${escapeHTML(player.username)}</td>
                <td class="score-cell">${player.score}/${totalQuestions}</td>
            </tr>
        `;
    });

    if (leaderboard.length === 0) {
        rowsHTML = `<tr><td colspan="3" style="padding:16px; color: var(--text-muted);">No scores yet — be the first!</td></tr>`;
    }

    const leaderboardHTML = `
        <div class="leaderboard-wrap">
            <h2 class="leaderboard-title">🏆 You scored ${score}/${totalQuestions}</h2>
            <p class="leaderboard-sub">Top 5 Leaderboard</p>
            <table class="leaderboard-table">
                <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Score</th>
                </tr>
                ${rowsHTML}
            </table>
            <button class="next-btn" onclick="location.reload()">Play Again 🔄</button>
        </div>
    `;

    document.getElementById('quiz').innerHTML = leaderboardHTML;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

startQuizApp();
