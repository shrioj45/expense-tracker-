(function(){
      const STORAGE_KEY = 'expenses-v1';
      let tx = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const txBody = document.getElementById('txBody');
      const totalIncomeEl = document.getElementById('totalIncome');
      const totalExpenseEl = document.getElementById('totalExpense');
      const balanceEl = document.getElementById('balance');
      const form = document.getElementById('entryForm');
      const typeInput = document.getElementById('type');
      const amountInput = document.getElementById('amount');
      const categoryInput = document.getElementById('category');
      const descInput = document.getElementById('description');
      const dateInput = document.getElementById('date');
      const filterCategory = document.getElementById('filterCategory');
      const filterTypeBtns = document.querySelectorAll('.filterType');
      const clearAllBtn = document.getElementById('clearAll');
      const emptyMsg = document.getElementById('empty');

   
      dateInput.valueAsDate = new Date();

      function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tx)); }
      function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

      function formatAmount(v){ return Number(v).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}); }
      function formatDate(d){ const dt = new Date(d); if(isNaN(dt)) return ''; return dt.toLocaleDateString(); }

      function render(){
        const catFilter = filterCategory.value;
        const activeType = document.querySelector('.filterType.active').dataset.type;
        const visible = tx.filter(t => (catFilter === 'all' || t.category === catFilter) && (activeType === 'all' || t.type === activeType));

        txBody.innerHTML = '';
        if(visible.length === 0){
          emptyMsg.hidden = false;
        } else {
          emptyMsg.hidden = true;
          visible.forEach(t => {
            const tr = document.createElement('tr');
            tr.dataset.id = t.id;
            tr.innerHTML = `
              <td>${formatDate(t.date)}</td>
              <td class="desc">${escapeHtml(t.description)}</td>
              <td>${escapeHtml(t.category)}</td>
              <td style="color:var(--muted);font-size:.9rem">${escapeHtml(t.note||'')}</td>
              <td style="text-align:right"><span class="amount ${t.type==='Income' ? 'income' : 'expense'}">${t.type==='Income' ? '+' : '-'}${formatAmount(t.amount)}</span></td>
              <td class="actions">
                <button data-action="edit" aria-label="Edit">Edit</button>
                <button data-action="delete" aria-label="Delete">Delete</button>
              </td>
            `;
            txBody.appendChild(tr);
          });
        }

        const totalIncome = tx.filter(t=>t.type==='Income').reduce((s,n)=>s+Number(n.amount),0);
        const totalExpense = tx.filter(t=>t.type==='Expense').reduce((s,n)=>s+Number(n.amount),0);
        totalIncomeEl.textContent = formatAmount(totalIncome);
        totalExpenseEl.textContent = formatAmount(totalExpense);
        balanceEl.textContent = formatAmount(totalIncome - totalExpense);
      }

      function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

     
      document.getElementById('addBtn').addEventListener('click', () => {
        const type = (typeInput.value || '').trim() || 'Expense';
        const amount = parseFloat(amountInput.value);
        const category = (categoryInput.value || '').trim();
        if(isNaN(amount) || amount <= 0){ alert('Enter a positive amount'); amountInput.focus(); return; }
        if(!category){ alert('Choose a category'); categoryInput.focus(); return; }
        const description = descInput.value.trim();
        const date = dateInput.value || new Date().toISOString();
        const id = uid();
        tx.unshift({ id, type: capitalize(type), amount: Math.abs(amount), category, description, date, note:'' });
        save(); render();
        amountInput.value=''; descInput.value=''; categoryInput.value=''; typeInput.value=''; dateInput.valueAsDate = new Date();
      });

      
      txBody.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if(!btn) return;
        const tr = btn.closest('tr');
        const id = tr.dataset.id;
        const idx = tx.findIndex(t => t.id === id);
        if(idx === -1) return;

        if(btn.dataset.action === 'delete'){
          if(confirm('Delete this transaction?')) {
            tx.splice(idx,1); save(); render();
          }
        }

        if(btn.dataset.action === 'edit'){
          
          const item = tx[idx];
          tr.innerHTML = `
            <td><input class="edit-input" type="date" value="${item.date.slice(0,10)}"></td>
            <td><input class="edit-input" type="text" value="${escapeAttr(item.description)}"></td>
            <td>
              <select class="edit-input">
                <option${item.category==='Food'?' selected':''}>Food</option>
                <option${item.category==='Travel'?' selected':''}>Travel</option>
                <option${item.category==='Rent'?' selected':''}>Rent</option>
                <option${item.category==='Shopping'?' selected':''}>Shopping</option>
                <option${item.category==='Salary'?' selected':''}>Salary</option>
                <option${item.category==='Other'?' selected':''}>Other</option>
              </select>
            </td>
            <td><input class="edit-input" type="text" value="${escapeAttr(item.note||'')}"></td>
            <td style="text-align:right">
              <input class="edit-input" type="number" step="0.01" value="${item.amount}" style="width:120px">
              <div style="margin-top:6px">
                <select class="edit-input" style="width:120px">
                  <option${item.type==='Income'?' selected':''}>Income</option>
                  <option${item.type==='Expense'?' selected':''}>Expense</option>
                </select>
              </div>
            </td>
            <td class="actions">
              <button data-action="save">Save</button>
              <button data-action="cancel">Cancel</button>
            </td>
          `;
        }

        if(btn.dataset.action === 'save'){
          
          const inputs = tr.querySelectorAll('.edit-input');
          const [dDate, dDesc, dCategory, dNote, dAmount, dType] = inputs;
          const newDate = dDate.value || item.date;
          const newDesc = dDesc.value.trim();
          const newCategory = dCategory.value;
          const newNote = dNote.value.trim();
          const newAmount = parseFloat(dAmount.value);
          const newTypeVal = dType.value;
          if(isNaN(newAmount) || newAmount <= 0){ alert('Enter positive amount'); return; }
          tx[idx].date = newDate;
          tx[idx].description = newDesc;
          tx[idx].category = newCategory;
          tx[idx].note = newNote;
          tx[idx].amount = Math.abs(newAmount);
          tx[idx].type = capitalize(newTypeVal);
          save(); render();
        }

        if(btn.dataset.action === 'cancel'){
          render();
        }
      });


      filterCategory.addEventListener('change', () => render());
      filterTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterTypeBtns.forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          render();
        });
      });

      clearAllBtn.addEventListener('click', () => {
        if(confirm('Clear all transactions? This cannot be undone.')){ tx = []; save(); render(); }
      });

      function capitalize(s){ return (s||'').toString().replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()); }
      function escapeAttr(s){ return (s||'').toString().replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

      render();
    })();