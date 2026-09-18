// API Configuration
const API_CONFIG = {
    baseURL: 'https://sickleave-miniapp.online', // Backend URL
    endpoints: {
        leaveLookup: '/api/seha/inquiries/sick-leave-details'
    }
};

// Function to make HTTP requests
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'حدث خطأ في الطلب');
        }

        return data;
    } catch (error) {
        console.error('خطأ في الطلب:', error);
        throw error;
    }
}

// Function to fetch sick leave data
async function fetchLeaveData(recordId, idNumber) {
    console.log("📥 [fetchLeaveData] القيم المستلمة:", { recordId, idNumber });

    try {
        const cleanDigits = (s) => String(s || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).trim();
        const cleanCode = (s) => cleanDigits(s).toUpperCase().replace(/\s+/g, '');

        const response = await fetch('/api/inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                leaveId: cleanCode(recordId),
                nationalId: cleanDigits(idNumber)
            })
        });

        const resData = await response.json();
        console.log("✅ البيانات جلبت من API:", resData);

        if (resData.success && resData.report) {
            const item = resData.report;
            const rData = item.data || {};
            return {
                name: item.patientName || item.name || rData.patient_name_ar || '-',
                report_date: item.issueDate || rData.issue_date || '-',
                entry_date: item.startDate || rData.admission_date || '-',
                exit_date: item.endDate || rData.discharge_date || '-',
                days: item.duration || rData.duration || '1',
                doctor: item.doctorName || rData.doctor_name_ar || '-',
                job_title: item.jobTitle || rData.job_title_ar || '-',
                companionName: item.companionName || rData.escort_name_ar || '',
                relation: item.relation || rData.relation_ar || ''
            };
        } else {
            return null;
        }

    } catch (error) {
        console.error("❌ حدث خطأ في جلب البيانات من API:", error);
        throw error;
    }
}

// Handle leave check form submission
async function handleCheckLeave(event) {
    event.preventDefault();

    const leaveNumber = document.getElementById("leaveNumber").value.trim();
    const idNumber = document.getElementById("idNumber").value.trim();
    const resultDiv = document.getElementById("result");
    const notFound=document.getElementById("notFound");
      const submitButton = document.getElementById("submitButton");

    console.log("📝 [handleCheckLeave] المدخلات من المستخدم:", { leaveNumber, idNumber });

    resultDiv.innerHTML = "";
    notFound.innerHTML = "";

    if (!leaveNumber || !idNumber) {
         notFound.innerHTML = `
  <p style="
    background: #ffc3c3ff;
    color:#4c0b14;
    border:1px solid #ea5050ff;
    border-radius:7px;
    padding:18px 22px;
    text-align:center;
    font-weight:600;
    line-height:1.6;
    margin:12px 0;
    box-shadow:0 1px 2px rgba(0,0,0,.04);
    direction:rtl;
  ">
   ادخل رمز الخدمة ورقم الهوية.
  </p>
`;
        return;
    }



    try {
        submitButton.classList.add("loading");
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span><span></span><span></span></span>\u0627\u0633\u062A\u0639\u0644\u0627\u0645';

        const leaveRecord = await fetchLeaveData(leaveNumber, idNumber);
        
        submitButton.classList.remove("loading");
        submitButton.disabled = false;
        submitButton.innerHTML = '\u0627\u0633\u062A\u0639\u0644\u0627\u0645';

        if (!leaveRecord) {
             notFound.innerHTML = `
  <p style="
    background: #ffc3c3ff;
    color:#4c0b14;
    border:1px solid #ea5050ff;
    border-radius:7px;
    padding:18px 22px;
    text-align:center;
    font-weight:600;
    line-height:1.6;
    margin:12px 0;
    box-shadow:0 1px 2px rgba(0,0,0,.04);
    direction:rtl;
  ">
    رقم الهوية خاطئ 
  </p>
`;
            return;
        }

        resultDiv.innerHTML = `
            <div class="result-box">
                <p>الاسم:<br> <span>${leaveRecord.name}</span></p>
                ${(leaveRecord.companionName && leaveRecord.companionName !== 'null') ? `
                <p>اسم المرافق:<br> <span>${leaveRecord.companionName}</span></p>
                <p>صلة القرابة:<br> <span>${leaveRecord.relation || ''}</span></p>
                ` : ''}
                <p>تاريخ إصدار تقرير الإجازة: <br><span>${leaveRecord.report_date}</span></p>
                <p>تبدأ من: <br><span>${leaveRecord.entry_date}</span></p>
                <p>وحتى:<br> <span>${leaveRecord.exit_date}</span></p>
                <p>المدة بالأيام: <br><span>${leaveRecord.days}</span></p>
                <p>اسم الطبيب: <br><span>${leaveRecord.doctor}</span></p>
                <p>المسمى الوظيفي:<br> <span>${leaveRecord.job_title}</span></p>
            </div>
        `;


           submitButton.textContent = "استعلام جديد";
        submitButton.removeEventListener("click", handleCheckLeave);
        submitButton.addEventListener("click", resetForm);
    } catch (error) {
        submitButton.classList.remove("loading");
        submitButton.disabled = false;
        submitButton.innerHTML = '\u0627\u0633\u062A\u0639\u0644\u0627\u0645';
        console.error("❌ Error:", error);
         notFound.innerHTML = `
  <p style="
    background: #ffc3c3ff;
    color:#4c0b14;
    border:1px solid #ea5050ff;
    border-radius:7px;
    padding:18px 22px;
    text-align:center;
    font-weight:600;
    line-height:1.6;
    margin:12px 0;
    box-shadow:0 1px 2px rgba(0,0,0,.04);
    direction:rtl;
  ">
    رقم الهوية خاطئ 
  </p>
`;
    }
}

// Function to reset the form
function resetForm(event) {
    event.preventDefault();
    
    const resultDiv = document.getElementById("result");
    const notFound = document.getElementById("notFound");
    const submitButton = document.getElementById("submitButton");
    const leaveNumberInput = document.getElementById("leaveNumber");
    const idNumberInput = document.getElementById("idNumber");
    
    // Clear fields and results
    leaveNumberInput.value = "";
    idNumberInput.value = "";
    resultDiv.innerHTML = "";
    notFound.innerHTML = "";
    
    // Reset button state
    submitButton.textContent = "استعلام";
    submitButton.removeEventListener("click", resetForm);
    submitButton.addEventListener("click", handleCheckLeave);
    
    // Focus on the first input field
    leaveNumberInput.focus();
}
