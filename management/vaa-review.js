"use strict";

let reviewSessions = new Map();
let reviewPilots = new Map();
let reviewHistory = new Map();
let reviewCases = new Map();
let openedReview = null;
let reviewSaving = false;

function reviewIssues(row) {
    const session = reviewSessions.get(row.vatsim_session_id);
    const pilotCid = reviewPilots.get(row.pilot_id);
    const history = reviewHistory.get(row.id) || [];
    const observed = Number(session?.verified_seconds) || 0;
    if (row.atc_provider?.toUpperCase() !== "VATSIM" && !observed && !row.vatsim_verified && !history.length) return [];
    const issues = [...row.reasons];
    if (pilotCid && row.cid && pilotCid !== row.cid) issues.push("Pilot profile CID differs from the PIREP");
    if (session?.owner_id && session.owner_id !== row.pilot_id) issues.push("Session belongs to a different pilot");
    if (session?.verified_cid && session.verified_cid !== row.cid) issues.push("Session CID differs from the PIREP");
    if (row.verification_method === "automatic") {
        if (!observed) issues.push("Automatic label has no positive ACARS observation");
        else if (observed !== Number(row.vatsim_participation_seconds)) issues.push("PIREP and ACARS durations differ");
        if (session?.network_callsign && session.network_callsign !== row.actual_callsign) issues.push("Session callsign differs from the PIREP");
    }
    if (row.is_historical_manual && !history.some(h => h.decision === "verified") && !row.external_evidence?.source && !row.legacy_review?.source)
        issues.push("Historical manual verification needs an evidence reference");
    if (row.vatsim_verified && Date.parse(row.landing)-Date.parse(row.takeoff) < 60000)
        issues.push("Less than one minute airborne. Check for an incomplete sector");
    return issues;
}

function renderReviews(windowData) {
    const picker = el("reviewFlight");
    const previous = picker.value;
    reviewCases = new Map();
    picker.replaceChildren(new Option("Choose a flight", ""));
    const rows = assessed.filter(r => (r.completed >= windowData.from && r.completed < windowData.until) ||
        (!Number.isFinite(r.completed) && Date.parse(r.created_at) >= windowData.from && Date.parse(r.created_at) < windowData.until));
    for (const row of rows.reverse()) {
        const issues = reviewIssues(row);
        const history = reviewHistory.get(row.id) || [];
        if (!issues.length && !history.length) continue;
        reviewCases.set(row.id, {row, issues, history});
        const label = [date(row.completed || Date.parse(row.created_at)).slice(0,10), row.pilot_code, row.atc_callsign || row.flight_number, row.departure + " → " + row.arrival].join(" · ");
        picker.add(new Option(label + (issues.length ? " — " + issues.join("; ") : " — Reviewed"), row.id));
    }
    if (reviewCases.has(previous)) picker.value = previous;
    else openReview();
    table("reviewSummary", ["Flight / pilot", "Route", "UTC date", "Discrepancy or evidence needed", "Review"], [...reviewCases.values()].map(({row, issues}) => [
        esc(row.atc_callsign || row.flight_number) + "<br>" + esc(row.pilot_code),
        esc(row.departure) + " → " + esc(row.arrival),
        date(row.completed || Date.parse(row.created_at)).slice(0,10),
        issues.length ? esc(issues.join(" · ")) : "Reviewed",
        '<button type="button" data-flight="' + esc(row.id) + '">Open review</button>'
    ]));
    el("reviewCount").textContent = [...reviewCases.values()].filter(item => item.issues.length).length + " flights with discrepancies in this window.";
}

function openReview() {
    const item = reviewCases.get(el("reviewFlight").value);
    el("reviewForm").reset();
    el("reviewForm").hidden = !item;
    openedReview = null;
    if (!item) return;
    const {row, issues, history} = item;
    openedReview = {id:row.id, version:history.at(-1)?.id ?? null};
    el("reviewIssues").textContent = issues.join(" · ") || "Management review recorded.";
    el("reviewCid").value = row.cid || reviewPilots.get(row.pilot_id) || "";
    el("reviewCall").value = row.actual_callsign || row.atc_callsign || row.flight_number || "";
    el("reviewSource").value = row.external_evidence?.source || row.legacy_review?.source || "";
    el("reviewHistory").textContent = history.map(h => date(h.recorded_at) + " · " + h.reviewer_name + " · " + h.decision + "\n" + h.notes + (h.evidence ? "\n" + h.evidence : "")).join("\n\n");
    el("reviewVerify").disabled = !issues.length || row.reasons.some(reason => /duplicate|timestamps|club|outstanding|status not eligible|missing ICAO|pilot record/i.test(reason));
}

document.addEventListener("DOMContentLoaded", () => {
el("reviewSummary").addEventListener("click", event => {
    const button = event.target.closest("button[data-flight]");
    if (!button || reviewSaving) return;
    el("reviewFlight").value = button.dataset.flight;
    openReview();
    el("reviewNote").focus();
});
el("reviewFlight").addEventListener("change", openReview);
el("reviewForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (!openedReview || !ready || busy || reviewSaving) return;
    const action = event.submitter?.value;
    const note = el("reviewNote").value.trim();
    const source = el("reviewSource").value.trim();
    const cid = el("reviewCid").value.trim();
    const call = el("reviewCall").value.trim().toUpperCase();
    if (action === "verified" && (!source || !/^[1-9]\d{5,8}$/.test(cid) || !/^(BMA|BMR)[A-Z0-9]{1,7}$/.test(call))) {
        el("reviewStatus").textContent = "Enter the independent evidence reference, CID and observed BMA/BMR callsign.";
        return;
    }
    reviewSaving = true;
    el("reviewInputs").disabled = true;
    el("reviewFlight").disabled = true;
    try {
        const {error} = await client.rpc("record_vaa_review", {flight:openedReview.id, action, note, source, confirmed_cid:cid, confirmed_callsign:call, last_review:openedReview.version});
        if (error) throw error;
        await refresh();
        openReview();
        el("reviewStatus").textContent = action === "verified" ? "Management verification saved." : "Management note saved.";
    } catch (error) {
        el("reviewStatus").textContent = error.message || "Save failed. Refresh and retry.";
    } finally {
        reviewSaving = false;
        el("reviewFlight").disabled = false;
        el("reviewInputs").disabled = false;
    }
});
});
