
// LINNOX CYBER ACADEMY
// Dashboard functionality

function openCourse(courseName) {

    alert(
        "Welcome to " + courseName +
        "!\n\nYour learning module is being prepared."
    );

}

function openLab() {

    alert(
        "Welcome to LINNOX Practice Lab!\n\n" +
        "Here you will learn through safe cybersecurity simulations."
    );

}

// Welcome message
console.log("LINNOX CYBER ACADEMY Dashboard Loaded Successfully.");

async function logoutStudent() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Logout failed: " + error.message);
        return;
    }

    window.location.href = "login.html";
}
