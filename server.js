const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

let customers = [
  {
    id: 1,
    name: "রহিম চাষী",
    phone: "01711-000000",
    totalAmount: 2500,
    paidAmount: 2000,
    dueAmount: 500,
    history: [
      { date: "২০২৬-০৮-১৫", service: "হাল চাষ", qty: "৪ বিঘা", rate: "৫০০ ৳/বিঘা", amount: 2000, paid: 2000, due: 0 },
      { date: "২০২৬-০৮-২০", service: "ভুট্টা মারাই", qty: "৫০ শতক", rate: "১০ ৳/শতক", amount: 500, paid: 0, due: 500 }
    ]
  }
];

app.post('/api/add-entry', (req, res) => {
  const { name, phone, service, qty, unit, rate, paid, date } = req.body;
  
  const numQty = parseFloat(qty) || 0;
  const numRate = parseFloat(rate) || 0;
  const numPaid = parseFloat(paid) || 0;
  
  const totalBill = numQty * numRate;
  const due = totalBill - numPaid;

  let customer = customers.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());

  const today = date || new Date().toISOString().split('T')[0];

  const newHistory = {
    date: today,
    service: service,
    qty: `${numQty} ${unit}`,
    rate: `${numRate} ৳/${unit}`,
    amount: totalBill,
    paid: numPaid,
    due: due
  };

  if (customer) {
    if(phone) customer.phone = phone;
    customer.totalAmount += totalBill;
    customer.paidAmount += numPaid;
    customer.dueAmount += due;
    customer.history.push(newHistory);
  } else {
    customer = {
      id: Date.now(),
      name: name.trim(),
      phone: phone || 'N/A',
      totalAmount: totalBill,
      paidAmount: numPaid,
      dueAmount: due,
      history: [newHistory]
    };
    customers.push(customer);
  }

  res.json({ success: true, customers });
});

app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>কৃষি গাড়ি হিসাব খাতা</title>
      <style>
        body { font-family: Arial, sans-serif; background-color: #eef2f5; margin: 0; padding: 15px; }
        .container { max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .proprietor-header { text-align: center; border-bottom: 2px dashed #2e7d32; padding-bottom: 12px; margin-bottom: 15px; }
        .proprietor-title { color: #1b5e20; font-size: 22px; font-weight: bold; margin: 0; }
        h2, h3 { color: #1b5e20; text-align: center; margin-top: 10px; }
        .form-box { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px; }
        .form-group { margin-bottom: 10px; }
        .form-group label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 14px; }
        .form-group input, .form-group select { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
        .form-row { display: flex; gap: 10px; }
        .btn-add { background: #2e7d32; color: white; border: none; padding: 12px; width: 100%; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 16px; margin-top: 10px; }
        
        .search-box-wrap { background: #e8f5e9; padding: 12px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #a5d6a7; }
        
        .index-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .index-table th, .index-table td { border: 1px solid #2e7d32; padding: 10px 5px; text-align: center; font-size: 13px; }
        .index-table th { background-color: #2e7d32; color: white; }
        .index-table tr:nth-child(even) { background-color: #f1f8e9; }
        .btn-view { background: #1b5e20; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }

        .hidden { display: none; }
        .btn-back { background: #555; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-bottom: 15px; font-size: 14px; }
        .summary-box { background: #f9f9f9; border: 1px solid #ddd; padding: 12px; border-radius: 6px; margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        
        <div id="listView">
          <div class="proprietor-header">
            <h1 class="proprietor-title">প্রোপাইটার: মোঃ রবিউল ইসলাম</h1>
          </div>

          <h2>🚜 হাল চাষ ও ভুট্টা মারাই খাতা</h2>
          
          <div class="form-box">
            <h3>➕ নতুন কাজের হিসাব যোগ করুন</h3>
            <div class="form-group">
              <label>কাস্টমারের নাম:</label>
              <input type="text" id="inpName" placeholder="যেমন: রহিম চাষী">
            </div>
            <div class="form-group">
              <label>মোবাইল নম্বর:</label>
              <input type="text" id="inpPhone" placeholder="017xxxxxxxx">
            </div>
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label>কাজের ধরন:</label>
                <select id="inpService" onchange="updateUnit()">
                  <option value="ভুট্টা মারাই">ভুট্টা মারাই</option>
                  <option value="হাল চাষ">হাল চাষ</option>
                </select>
              </div>
              <div class="form-group" style="flex: 1;">
                <label>একক (Unit):</label>
                <input type="text" id="inpUnit" value="শতক">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label>পরিমাণ:</label>
                <input type="number" id="inpQty" placeholder="কত শতক/বিঘা" oninput="calcTotal()">
              </div>
              <div class="form-group" style="flex: 1;">
                <label>দর (টাকা):</label>
                <input type="number" id="inpRate" value="10" placeholder="প্রতি একক দর" oninput="calcTotal()">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label>মোট বিল:</label>
                <input type="number" id="inpTotal" readonly placeholder="০" style="background:#eee;">
              </div>
              <div class="form-group" style="flex: 1;">
                <label>জমা টাকা:</label>
                <input type="number" id="inpPaid" placeholder="০">
              </div>
            </div>
            <button class="btn-add" onclick="submitEntry()">হিসাব সেভ করুন</button>
          </div>

          <h3>📖 হিসাবের সূচি (কাস্টমার তালিকা)</h3>
          
          <div class="search-box-wrap">
            <div class="form-group" style="margin: 0;">
              <label>🔍 কাস্টমার খুঁজুন (বাংলায় নাম লিখুন):</label>
              <input type="text" id="searchBox" placeholder="যেমন: এরশাদ বা রহিম..." oninput="filterCustomers()">
            </div>
          </div>

          <table class="index-table">
            <thead>
              <tr>
                <th>ক্রঃ</th>
                <th>নাম</th>
                <th>মোট</th>
                <th>বাকি</th>
                <th>বিস্তারিত</th>
              </tr>
            </thead>
            <tbody id="indexTableBody"></tbody>
          </table>
        </div>

        <div id="detailView" class="hidden">
          <button class="btn-back" onclick="showList()">⬅ সূচিতে ফিরে যান</button>
          <h2 id="custName">কাস্টমারের নাম</h2>
          <div class="summary-box">
            <p><strong>মোবাইল:</strong> <span id="custPhone"></span></p>
            <p><strong>মোট কাজের বিল:</strong> <span id="custTotal"></span> টাকা</p>
            <p><strong>মোট জমা:</strong> <span id="custPaid"></span> টাকা</p>
            <p style="color:#c62828;"><strong>মোট বাকি:</strong> <span id="custDue"></span> টাকা</p>
          </div>
          <h3>কাজের বিস্তারিত ইতিহাস</h3>
          <table class="index-table">
            <thead>
              <tr>
                <th>তারিখ</th>
                <th>কাজ</th>
                <th>পরিমাণ</th>
                <th>মোট</th>
                <th>বাকি</th>
              </tr>
            </thead>
            <tbody id="historyTable"></tbody>
          </table>
        </div>

      </div>

      <script>
        let customerData = [];

        async function fetchCustomers() {
          try {
            const res = await fetch('/api/customers');
            customerData = await res.json();
            renderIndex(customerData);
          } catch(e) {
            console.error(e);
          }
        }

        function updateUnit() {
          const service = document.getElementById('inpService').value;
          if(service === 'ভুট্টা মারাই') {
            document.getElementById('inpUnit').value = 'শতক';
            document.getElementById('inpRate').value = '10';
          } else {
            document.getElementById('inpUnit').value = 'বিঘা';
            document.getElementById('inpRate').value = '500';
          }
          calcTotal();
        }

        function calcTotal() {
          const qty = parseFloat(document.getElementById('inpQty').value) || 0;
          const rate = parseFloat(document.getElementById('inpRate').value) || 0;
          document.getElementById('inpTotal').value = qty * rate;
        }

        async function submitEntry() {
          const name = document.getElementById('inpName').value;
          const phone = document.getElementById('inpPhone').value;
          const service = document.getElementById('inpService').value;
          const unit = document.getElementById('inpUnit').value;
          const qty = document.getElementById('inpQty').value;
          const rate = document.getElementById('inpRate').value;
          const paid = document.getElementById('inpPaid').value || 0;

          if(!name || !qty || !rate) {
            alert('অনুগ্রহ করে কাস্টমারের নাম, পরিমাণ এবং দর লিখুন!');
            return;
          }

          const response = await fetch('/api/add-entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, service, unit, qty, rate, paid })
          });

          const result = await response.json();
          if(result.success) {
            customerData = result.customers;
            document.getElementById('searchBox').value = '';
            renderIndex(customerData);
            document.getElementById('inpName').value = '';
            document.getElementById('inpPhone').value = '';
            document.getElementById('inpQty').value = '';
            document.getElementById('inpPaid').value = '';
            document.getElementById('inpTotal').value = '';
            alert('হিসাব সফলভাবে সূচিতে যুক্ত হয়েছে!');
          }
        }

        function renderIndex(list) {
          const tbody = document.getElementById('indexTableBody');
          tbody.innerHTML = '';
          if(list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">কোনো কাস্টমার পাওয়া যায়নি</td></tr>';
            return;
          }
          list.forEach((c, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td><b>\${index + 1}</b></td>
              <td><b>\${c.name}</b></td>
              <td>\${c.totalAmount} ৳</td>
              <td style="color:\${c.dueAmount > 0 ? 'red' : 'green'}; font-weight:bold;">\${c.dueAmount} ৳</td>
              <td><button class="btn-view" onclick="showDetail(\${c.id})">দেখুন</button></td>
            \`;
            tbody.appendChild(tr);
          });
        }

        function filterCustomers() {
          const query = document.getElementById('searchBox').value.trim().toLowerCase();
          const filtered = customerData.filter(c => c.name.toLowerCase().includes(query));
          renderIndex(filtered);
        }

        function showDetail(id) {
          const c = customerData.find(item => item.id === id);
          if(!c) return;

          document.getElementById('custName').innerText = c.name;
          document.getElementById('custPhone').innerText = c.phone;
          document.getElementById('custTotal').innerText = c.totalAmount;
          document.getElementById('custPaid').innerText = c.paidAmount;
          document.getElementById('custDue').innerText = c.dueAmount;

          const tbody = document.getElementById('historyTable');
          tbody.innerHTML = '';
          c.history.forEach(h => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td>\${h.date}</td>
              <td><b>\${h.service}</b></td>
              <td>\${h.qty}</td>
              <td>\${h.amount} ৳</td>
              <td style="color:\${h.due > 0 ? 'red' : 'green'}; font-weight:bold;">\${h.due} ৳</td>
            \`;
            tbody.appendChild(tr);
          });

          document.getElementById('listView').classList.add('hidden');
          document.getElementById('detailView').classList.remove('hidden');
        }

        function showList() {
          document.getElementById('detailView').classList.add('hidden');
          document.getElementById('listView').classList.remove('hidden');
        }

        fetchCustomers();
      </script>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
