
function runCommand() {

    const input = document.getElementById("command");
    const output = document.getElementById("output");

    const command = input.value.trim().toLowerCase();

    if (command === "") {
        return;
    }

    const userCommand = document.createElement("p");
    userCommand.textContent = "student@linnox:~$ " + command;
    output.appendChild(userCommand);

    const response = document.createElement("p");

    switch (command) {

        case "help":
            response.textContent =
                "Available commands: help, about, tools, security, clear";
            break;

        case "about":
            response.textContent =
                "LINNOX CYBER ACADEMY teaches ethical hacking and cybersecurity.";
            break;

        case "tools":
            response.textContent =
                "Learning tools: Web browser, VS Code and Wireshark (educational use).";
            break;

        case "security":
            response.textContent =
                "Cybersecurity protects systems, networks and information.";
            break;

        case "clear":
            output.innerHTML = "";
            input.value = "";
            return;

        default:
            response.textContent =
                "Command not recognized. Type help to see available commands.";
    }

    output.appendChild(response);

    input.value = "";
    output.scrollTop = output.scrollHeight;
}

document.getElementById("command").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        runCommand();
    }
});
