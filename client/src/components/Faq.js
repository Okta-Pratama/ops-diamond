import React, { useState, useEffect } from 'react';
import api from '../api';

const Faq = () => {
  const [faqs, setFaqs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null); // default closed

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await api.get('/faqs');
        setFaqs(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Gagal memuat FAQ");
      }
    };
    fetchFaqs();
  }, []);

  const toggleAccordion = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null); // close if already open
    } else {
      setActiveIndex(index);
    }
  };

  return (
    <div className="mb-5">
      <div className="accordion" id="faqAccordion">
        {faqs.map((faq, index) => {
          const isOpen = activeIndex === index;
          return (
            <div className="accordion-item" key={faq.id}>
              <h2 className="accordion-header">
                <button 
                  className={`accordion-button ${!isOpen ? 'collapsed' : ''}`} 
                  type="button" 
                  onClick={() => toggleAccordion(index)}
                  style={{ outline: 'none', boxShadow: 'none' }}
                >
                  {faq.question}
                </button>
              </h2>
              <div 
                className={`accordion-collapse collapse ${isOpen ? 'show' : ''}`} 
              >
                <div className="accordion-body text-secondary">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Faq;