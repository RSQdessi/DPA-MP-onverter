let machine = null;

document.getElementById('fileInput').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (file) {
        try {
            const data = JSON.parse(await file.text());
            machine = initializeMachine(data);
            displayMachine(machine);
            document.getElementById('checkButton').disabled = false;
        } catch (err) {
            alert("Ошибка при загрузке файла: " + err.message);
        }
    }
});

document.getElementById('checkButton').addEventListener('click', function () {
    const chain = document.getElementById('chainInput').value;
    const log = document.getElementById('log');
    log.innerHTML = "";
    if (!machine) {
        log.textContent = "Ошибка: ДМПА не загружен.";
        return;
    }
    const { success, steps } = checkChain(chain, machine, log);
    log.innerHTML += success
        ? `<span class="success">Цепочка принадлежит заданному ДМПА.</span><br>`
        : `<span class="error">Цепочка не принадлежит заданному ДМПА.</span><br>`;
    displaySteps(steps, log);
});

function initializeMachine(data) {
    const rules = data.rules.map(rule => ({
        currentState: rule[0],
        input: rule[1] === "EPS" ? "ε" : rule[1],
        stackTop: rule[2],
        nextState: rule[3],
        stackPush: rule[4] === "EPS" ? "ε" : rule[4],
        output: rule[5] || "ε" // Новый элемент: выходной символ
    }));
    return {
        states: data.states,
        alphabet: data.alphabet,
        stackAlphabet: data.in_stack,
        outputAlphabet: data.in_transform,
        rules,
        startState: data.start,
        currentState: data.start,
        startStack: data.start_stack,
        stack: [data.start_stack],
        endState: data.end,
        transformOutput: "" // Поле для накопления выходного результата
    };
}

function displayMachine(machine) {
    const info = document.getElementById('machineInfo');
    const table = document.getElementById('transitionTable');
    info.innerHTML = `
        <strong>ДМПА:</strong> P({${machine.states}}, {${machine.alphabet}}, {${machine.stackAlphabet}}, δ, ${machine.startState}, ${machine.startStack}, ${machine.endState})
    `;
    table.innerHTML = "<strong>Таблица переходов:</strong><br>";
    machine.rules.forEach(rule => {
        table.innerHTML += `(${rule.currentState}, ${rule.input}, ${rule.stackTop}) → (${rule.nextState}, ${rule.stackPush}, ${rule.output})<br>`;
    });
}

function checkChain(chain, machine, log) {
    machine.currentState = machine.startState;
    machine.stack = [machine.startStack];
    machine.transformOutput = ""; // Сброс выходного результата
    const steps = []; // Для сохранения шагов выполнения

    const isAlphabetValid = chain.split("").every(c => machine.alphabet.includes(c));
    if (!isAlphabetValid) {
        log.innerHTML += `<span class="error">Ошибка: цепочка содержит символы, отсутствующие в алфавите.</span><br>`;
        return { success: false, steps };
    }

    for (let i = 0; i <= chain.length; i++) {
        const currentInput = chain[i] || "ε";
        log.innerHTML += `Текущее состояние: ${machine.currentState}, Вход: ${currentInput}, Стек: ${machine.stack.join("")}<br>`;
        const transition = machine.rules.find(rule =>
            rule.currentState === machine.currentState &&
            rule.input === currentInput &&
            rule.stackTop === (machine.stack[0] || "ε")
        );

        if (transition) {
            machine.currentState = transition.nextState;
            if (transition.stackPush !== "ε") {
                machine.stack.unshift(...transition.stackPush.split("").reverse());
            }
            if (transition.stackTop !== "ε") {
                machine.stack.shift();
            }
            // Добавляем символ в выход, если он не равен EPS
            if (transition.output && transition.output !== "ε" && transition.output !== "EPS") { 
                machine.transformOutput += transition.output; 
            }

            steps.push({
                step: steps.length + 1,
                currentState: machine.currentState,
                currentInput,
                stack: [...machine.stack],
                output: machine.transformOutput,
                rule: `(${transition.currentState}, ${transition.input}, ${transition.stackTop}) → (${transition.nextState}, ${transition.stackPush}, ${transition.output})`
            });
        } else {
            log.innerHTML += `<span class="error">Ошибка: отсутствует переход из текущего состояния.</span><br>`;
            return { success: false, steps };
        }
    }

    const success = machine.stack.length === 0 && machine.currentState === machine.endState;
    return { success, steps };
}


function displaySteps(steps, log) {
    steps.forEach(step => {
        log.innerHTML += `
            <strong>Шаг ${step.step}:</strong>
            Текущее состояние: ${step.currentState}
            Вход: ${step.currentInput}
            Стек: ${step.stack.join("")}
            Примененное правило: ${step.rule}
            <span class="success">Выход: ${step.output}</span><hr>
            
        `;
    });
}

document.getElementById('toLab4').addEventListener('click', function() {
    window.location.href = 'index.html';
});
