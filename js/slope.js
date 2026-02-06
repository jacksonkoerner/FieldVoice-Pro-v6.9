// ============================================================================
// FieldVoice Pro - Slope & Grade Calculator (slope.js)
//
// Enter any two of Rise/Run/Slope% and the third auto-calculates.
// Shows grade%, degrees, ratio, ADA compliance, drainage check.
// ============================================================================

function openSlope() {
    var overlay = document.getElementById('slopeOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    var strip = document.getElementById('emergencyStrip');
    if (strip) strip.classList.add('hidden');
    var panel = document.getElementById('emergencyPanel');
    if (panel) panel.classList.add('hidden');
    renderSlopeUI();
}

function closeSlope() {
    var overlay = document.getElementById('slopeOverlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    var strip = document.getElementById('emergencyStrip');
    if (strip) strip.classList.remove('hidden');
}

function renderSlopeUI() {
    var content = document.getElementById('slopeContent');
    if (!content) return;

    content.innerHTML =
        '<div class="p-4 overflow-y-auto flex-1">' +
            // Input card
            '<div class="bg-white rounded-lg border border-slate-200 p-4 mb-4">' +
                '<p class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Enter Any Two Values</p>' +
                '<div class="space-y-3">' +
                    slopeInput('Rise (vertical)', 'slopeRise', 'ft', 'calcSlopeFrom("rise")') +
                    slopeInput('Run (horizontal)', 'slopeRun', 'ft', 'calcSlopeFrom("run")') +
                    slopeInput('Slope', 'slopeGrade', '%', 'calcSlopeFrom("grade")') +
                '</div>' +
            '</div>' +
            // Visual diagram
            '<div class="bg-white rounded-lg border border-slate-200 p-4 mb-4">' +
                '<p class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3">Visual</p>' +
                '<div id="slopeDiagram" class="flex items-end justify-center" style="height:120px;">' +
                    buildSlopeDiagram(0) +
                '</div>' +
            '</div>' +
            // Results
            '<div id="slopeResults" class="bg-white rounded-lg border border-slate-200 p-4 mb-4">' +
                '<p class="text-sm text-slate-400 text-center">Enter two values to calculate</p>' +
            '</div>' +
            // Quick reference
            '<div class="bg-white rounded-lg border border-slate-200 p-4">' +
                '<p class="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3"><i class="fas fa-book mr-1"></i>Quick Reference</p>' +
                '<div class="space-y-2 text-sm">' +
                    refRow('ADA Max Ramp', '8.33% (1:12)') +
                    refRow('Typical Sidewalk', '2% cross-slope') +
                    refRow('Min Drainage', '1\u20132%') +
                    refRow('Typical Road Crown', '2%') +
                    refRow('Max Driveway', '12\u201315%') +
                '</div>' +
            '</div>' +
        '</div>';
}

function slopeInput(label, id, unit, oninput) {
    return '<div>' +
        '<label class="text-xs text-slate-500 uppercase mb-1 block">' + label + '</label>' +
        '<div class="flex items-center gap-2">' +
            '<input type="number" id="' + id + '" oninput="' + oninput + '" placeholder="0" step="any" class="flex-1 bg-slate-50 rounded-lg p-3 text-slate-800 font-bold" style="min-height:44px;">' +
            '<span class="text-sm text-slate-400 font-bold w-8">' + unit + '</span>' +
        '</div></div>';
}

function refRow(label, value) {
    return '<div class="flex justify-between items-center py-1.5 border-b border-slate-100">' +
        '<span class="text-slate-600">' + label + '</span>' +
        '<span class="font-bold text-slate-800">' + value + '</span></div>';
}

// Tracks which field was last edited by the user to avoid overwriting it
var slopeLastEdited = null;

function calcSlopeFrom(source) {
    slopeLastEdited = source;

    var riseEl = document.getElementById('slopeRise');
    var runEl = document.getElementById('slopeRun');
    var gradeEl = document.getElementById('slopeGrade');
    if (!riseEl || !runEl || !gradeEl) return;

    var rise = parseFloat(riseEl.value);
    var run = parseFloat(runEl.value);
    var grade = parseFloat(gradeEl.value);

    var hasRise = !isNaN(rise) && riseEl.value !== '';
    var hasRun = !isNaN(run) && runEl.value !== '';
    var hasGrade = !isNaN(grade) && gradeEl.value !== '';

    // Auto-calculate the missing field based on the two known fields
    if (source === 'rise' || source === 'run') {
        // User edited rise or run
        if (hasRise && hasRun && run !== 0) {
            grade = (rise / run) * 100;
            gradeEl.value = grade.toFixed(2);
            hasGrade = true;
        } else if (hasRise && hasGrade && grade !== 0) {
            run = rise / (grade / 100);
            runEl.value = run.toFixed(2);
            hasRun = true;
        } else if (hasRun && hasGrade) {
            rise = run * (grade / 100);
            riseEl.value = rise.toFixed(2);
            hasRise = true;
        }
    } else if (source === 'grade') {
        // User edited grade
        if (hasGrade && hasRun) {
            rise = run * (grade / 100);
            riseEl.value = rise.toFixed(2);
            hasRise = true;
        } else if (hasGrade && hasRise && grade !== 0) {
            run = rise / (grade / 100);
            runEl.value = run.toFixed(2);
            hasRun = true;
        }
    }

    // Display results if we have enough data
    if (hasRise && hasRun && hasGrade) {
        displaySlopeResults(rise, run, grade);
    }
}

function displaySlopeResults(rise, run, grade) {
    var el = document.getElementById('slopeResults');
    var diagram = document.getElementById('slopeDiagram');
    if (!el) return;

    var degrees = Math.atan2(rise, run) * (180 / Math.PI);
    var ratio = run !== 0 ? run / rise : Infinity;
    var risePer100 = grade; // grade% IS rise per 100ft run

    var adaOk = Math.abs(grade) <= 8.33;
    var drainOk = Math.abs(grade) >= 1;
    var drainWarn = Math.abs(grade) > 0 && Math.abs(grade) < 1;

    var ratioStr = isFinite(ratio) ? '1:' + Math.abs(ratio).toFixed(1) : '1:\u221E';

    el.innerHTML =
        resultRowSlope('Grade', Math.abs(grade).toFixed(2) + '%') +
        resultRowSlope('Degrees', Math.abs(degrees).toFixed(2) + '\u00B0') +
        resultRowSlope('Ratio', ratioStr) +
        resultRowSlope('Rise per 100ft', Math.abs(risePer100).toFixed(2) + ' ft') +
        '<div class="flex justify-between items-center py-2 border-b border-slate-100">' +
            '<span class="text-xs text-slate-500 uppercase">ADA Compliant?</span>' +
            (adaOk
                ? '<span class="text-safety-green font-bold"><i class="fas fa-check-circle mr-1"></i>Yes (\u2264 8.33%)</span>'
                : '<span class="text-red-500 font-bold"><i class="fas fa-times-circle mr-1"></i>No (\u003E 8.33%)</span>') +
        '</div>' +
        '<div class="flex justify-between items-center py-2">' +
            '<span class="text-xs text-slate-500 uppercase">Drainage Adequate?</span>' +
            (drainOk
                ? '<span class="text-safety-green font-bold"><i class="fas fa-check-circle mr-1"></i>Yes (\u2265 1%)</span>'
                : (drainWarn
                    ? '<span class="text-dot-yellow font-bold"><i class="fas fa-exclamation-triangle mr-1"></i>Low (\u003C 1%)</span>'
                    : '<span class="text-red-500 font-bold"><i class="fas fa-times-circle mr-1"></i>No (0%)</span>')) +
        '</div>';

    if (diagram) {
        diagram.innerHTML = buildSlopeDiagram(Math.min(Math.abs(degrees), 45));
    }
}

function resultRowSlope(label, value) {
    return '<div class="flex justify-between items-center py-2 border-b border-slate-100">' +
        '<span class="text-xs text-slate-500 uppercase">' + label + '</span>' +
        '<span class="text-xl font-bold text-slate-800">' + value + '</span></div>';
}

function buildSlopeDiagram(deg) {
    // Clamp for visual display (max 45 degrees for readability)
    var clampedDeg = Math.min(deg, 45);
    var tanVal = Math.tan(clampedDeg * Math.PI / 180);
    var baseW = 200;
    var riseH = Math.round(baseW * tanVal);
    if (riseH < 2) riseH = 2;
    if (riseH > 110) riseH = 110;

    return '<div style="position:relative;width:' + baseW + 'px;height:' + riseH + 'px;">' +
        // Triangle using CSS borders
        '<div style="width:0;height:0;border-left:' + baseW + 'px solid #1e3a5f;border-top:' + riseH + 'px solid transparent;position:absolute;bottom:0;left:0;"></div>' +
        // Run label
        '<span style="position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:10px;color:#64748b;font-weight:bold;">RUN</span>' +
        // Rise label
        '<span style="position:absolute;right:-30px;top:50%;transform:translateY(-50%);font-size:10px;color:#64748b;font-weight:bold;">RISE</span>' +
        // Angle arc indicator
        '<span style="position:absolute;bottom:2px;left:30px;font-size:10px;color:#ea580c;font-weight:bold;">' + deg.toFixed(1) + '\u00B0</span>' +
    '</div>';
}
