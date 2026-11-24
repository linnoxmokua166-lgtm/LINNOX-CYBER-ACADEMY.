
async function loadAdminDashboard() {
    const message = document.getElementById("message");
    const table = document.getElementById("resultsTable");
    const searchInput = document.getElementById("searchInput");

    try {
        const { data: { user }, error } =
            await supabaseClient.auth.getUser();

        if (error || !user) {
            window.location.href = "login.html";
            return;
        }

        const { data: adminRecord, error: adminError } =
            await supabaseClient
                .from("admin_users")
                .select("user_id")
                .eq("user_id", user.id)
                .maybeSingle();

        if (adminError || !adminRecord) {
            window.location.href = "dashboard.html";
            return;
        }

        message.textContent = "Loading student results...";

        const { data: results, error: resultsError } =
            await supabaseClient
                .from("quiz_results")
                .select("*")
                .order("completed_at", { ascending: false });

        if (resultsError) throw resultsError;

        const total = results.length;
        const passes = results.filter(r => r.status === "PASS").length;
        const failures = results.filter(r => r.status === "FAIL").length;

        document.getElementById("totalAttempts").textContent = total;
        document.getElementById("totalPasses").textContent = passes;
        document.getElementById("totalFailures").textContent = failures;

        const studentIds = new Set(results.map(r => r.student_id));

        const average = total
            ? results.reduce((sum, r) => sum + r.percentage, 0) / total
            : 0;

        const highest = total
            ? Math.max(...results.map(r => r.percentage))
            : 0;

        const passRate = total ? (passes / total) * 100 : 0;

        document.getElementById("totalStudents").textContent =
            studentIds.size;

        document.getElementById("averageScore").textContent =
            average.toFixed(1) + "%";

        document.getElementById("highestScore").textContent =
            highest + "%";

        document.getElementById("passRate").textContent =
            passRate.toFixed(1) + "%";

        function displayResults(searchTerm = "") {
            table.innerHTML = "";

            const term = searchTerm.toLowerCase().trim();

            const filtered = results.filter(result =>
                (result.student_id || "").toLowerCase().includes(term) ||
                (result.course_name || "").toLowerCase().includes(term)
            );

            if (filtered.length === 0) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");
                cell.colSpan = 6;
                cell.textContent = "No matching results found.";
                row.appendChild(cell);
                table.appendChild(row);
                return;
            }

            filtered.forEach(result => {
                const row = document.createElement("tr");

                const values = [
                    result.student_id,
                    result.course_name,
                    result.score,
                    result.percentage + "%",
                    result.status,
                    new Date(result.completed_at).toLocaleString()
                ];

                values.forEach((value, index) => {
                    const cell = document.createElement("td");
                    cell.textContent = value ?? "";

                    if (index === 4) {
                        cell.className = result.status === "PASS"
                            ? "status-pass"
                            : "status-fail";
                    }

                    row.appendChild(cell);
                });

                table.appendChild(row);
            });
        }

        displayResults();

        searchInput.addEventListener("input", () => {
            displayResults(searchInput.value);
        });

        await loadCertificateRequests(user.id);

        message.textContent = "Admin dashboard loaded successfully.";

    } catch (error) {
        message.textContent = "Error: " + error.message;
        console.error(error);
    }
}


// Load certificate requests
async function loadCertificateRequests(adminId) {
    const table = document.getElementById("certificateRequestsTable");
    const message = document.getElementById("certificateMessage");

    table.innerHTML = "";
    message.textContent = "Loading certificate requests...";

    const { data: requests, error } = await supabaseClient
        .from("certificate_requests")
        .select("*")
        .order("requested_at", { ascending: false });

    if (error) {
        message.textContent = "Could not load requests: " + error.message;
        console.error(error);
        return;
    }

    const pending = requests.filter(r => r.status === "PENDING").length;
    const approved = requests.filter(r => r.status === "APPROVED").length;
    const rejected = requests.filter(r => r.status === "REJECTED").length;

    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("approvedCount").textContent = approved;
    document.getElementById("rejectedCount").textContent = rejected;

    if (requests.length === 0) {
        message.textContent = "There are no certificate requests yet.";
        return;
    }

    message.textContent = "Certificate requests loaded.";

    requests.forEach(request => {
        const row = document.createElement("tr");

        const studentCell = document.createElement("td");
        studentCell.textContent = request.student_name || "Student";

        const idCell = document.createElement("td");
        idCell.textContent = request.student_id;

        const courseCell = document.createElement("td");
        courseCell.textContent = request.course_name;

        const dateCell = document.createElement("td");
        dateCell.textContent =
            new Date(request.requested_at).toLocaleString();

        const statusCell = document.createElement("td");
        statusCell.textContent = request.status;
        statusCell.className = "status-" + request.status.toLowerCase();

        const certificateCell = document.createElement("td");
        certificateCell.textContent = request.certificate_id || "Not issued";

        const actionCell = document.createElement("td");

        if (request.status === "PENDING") {
            const approveButton = document.createElement("button");
            approveButton.textContent = "Approve";
            approveButton.className = "approve-button";
            approveButton.addEventListener("click", () => {
                reviewCertificate(request.id, adminId, "APPROVED");
            });

            const rejectButton = document.createElement("button");
            rejectButton.textContent = "Reject";
            rejectButton.className = "reject-button";
            rejectButton.addEventListener("click", () => {
                reviewCertificate(request.id, adminId, "REJECTED");
            });

            actionCell.append(approveButton, rejectButton);
        } else {
            actionCell.textContent = "Reviewed";
        }

        row.append(
            studentCell,
            idCell,
            courseCell,
            dateCell,
            statusCell,
            certificateCell,
            actionCell
        );

        table.appendChild(row);
    });
}


// Approve or reject a certificate request
async function reviewCertificate(requestId, adminId, decision) {
    const confirmed = confirm(
        decision === "APPROVED"
            ? "Approve this certificate request?"
            : "Reject this certificate request?"
    );

    if (!confirmed) return;

    const updateData = {
        status: decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId
    };

    if (decision === "APPROVED") {
        updateData.certificate_id =
            "LCA-" + crypto.randomUUID().toUpperCase();
    }

    if (decision === "REJECTED") {
        updateData.certificate_id = null;
    }

    const { data, error } = await supabaseClient
        .from("certificate_requests")
        .update(updateData)
        .eq("id", requestId)
        .eq("status", "PENDING")
        .select();

    if (error) {
        alert("Could not update request: " + error.message);
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        alert("This request may already have been reviewed. Refresh the page.");
        return;
    }

    alert(
        decision === "APPROVED"
            ? "Certificate approved successfully!"
            : "Certificate request rejected."
    );

    loadCertificateRequests(adminId);
}


// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
});


// Start dashboard
loadAdminDashboard();
