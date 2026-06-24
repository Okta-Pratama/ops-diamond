import React, { useState, useEffect } from 'react';
import api from '../api';

const FAQ = () => {
  const [faqs, setFaqs] = useState([]);
  
  useEffect(() => {
    api.get('/faqs').then(res => setFaqs(res.data)).catch(console.error);
  }, []);

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Frequently Asked Questions</h2>
      <div className="accordion" id="faqAccordion">
        {faqs.map((faq, idx) => (
          <div className="accordion-item" key={faq.id}>
            <h2 className="accordion-header">
              <button className={`accordion-button ${idx !== 0 ? 'collapsed' : ''}`} type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${faq.id}`}>
                {faq.question}
              </button>
            </h2>
            <div id={`collapse${faq.id}`} className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`} data-bs-parent="#faqAccordion">
              <div className="accordion-body">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 p-4 bg-light rounded text-center">
        <h4>Punya Saran atau Pertanyaan Lain?</h4>
        <p>Hubungi Customer Service kami untuk bantuan lebih lanjut.</p>
        <button className="btn btn-primary mt-2">Hubungi CS via WhatsApp</button>
      </div>
    </div>
  );
};


export default FAQ;
