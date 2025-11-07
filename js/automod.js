let badWords = [];

function addBadWord() {
  const input = document.getElementById("newBadWord");
  const word = input.value.trim().toLowerCase();

  if (word && !badWords.includes(word)) {
    badWords.push(word);
    renderBadWords();
    input.value = "";
  }
}

function removeBadWord(word) {
  badWords = badWords.filter((w) => w !== word);
  renderBadWords();
}

function renderBadWords() {
  const container = document.getElementById("badWordsList");

  if (badWords.length === 0) {
    container.innerHTML =
      '<span class="empty-state">Még nincsenek tiltott szavak hozzáadva</span>';
    return;
  }

  container.innerHTML = badWords
    .map(
      (word) => `
                <div class="word-tag">
                    <span>${word}</span>
                    <span class="remove-btn" onclick="removeBadWord('${word}')">×</span>
                </div>
            `
    )
    .join("");
}

document
  .getElementById("newBadWord")
  .addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      addBadWord();
    }
  });

function saveSettings() {
  const settings = {
    spam: {
      enabled: document.getElementById("spamProtection").checked,
      maxMessages: parseInt(document.getElementById("maxMessages").value),
      capsLimit: parseInt(document.getElementById("capsLimit").value),
    },
    emoji: {
      enabled: document.getElementById("emojiSpam").checked,
      maxEmojis: parseInt(document.getElementById("maxEmojis").value),
    },
    badWords: {
      enabled: document.getElementById("badWordFilter").checked,
      words: badWords,
    },
    warnings: {
      autoEnabled: document.getElementById("autoWarnPunish").checked,
      timeoutAt: parseInt(document.getElementById("warnTimeout").value),
      kickAt: parseInt(document.getElementById("warnKick").value),
      banAt: parseInt(document.getElementById("warnBan").value),
      expiryDays: parseInt(document.getElementById("warnExpiry").value),
    },
  };

  console.log("Mentett beállítások:", settings);


  const btn = document.querySelector(".save-btn");
  const originalText = btn.textContent;
  btn.textContent = "✅ Mentve!";
  btn.style.background = "#3ba55d";

  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = "";
  }, 2000);
}

function loadSettings() {
  badWords = ["teszt1"];
  renderBadWords();

}

loadSettings();
