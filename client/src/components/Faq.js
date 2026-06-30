import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Minus } from 'lucide-react';

const Faq = () => {
  const [faqs, setFaqs] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await api.get('/faqs');
        setFaqs(res.data);
      } catch (err) {
        console.error("Gagal memuat FAQ");
      }
    };
    fetchFaqs();
  }, []);

  const toggleAccordion = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null);
    } else {
      setActiveIndex(index);
    }
  };

  return (
    <div className="mb-5">
      <div className="accordion d-flex flex-column gap-3" id="faqAccordion">
        {faqs.map((faq, index) => {
          const isOpen = activeIndex === index;
          return (
            <div 
              className="accordion-item shadow-sm" 
              key={faq.id} 
              style={{ 
                border: isOpen ? '1px solid #b91c1c' : '1px solid rgba(0,0,0,0.05)', 
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: isOpen ? '#fff' : '#f8fafc',
                transition: 'all 0.3s ease'
              }}
            >
              <h2 className="accordion-header m-0">
                <button 
                  className="w-100 d-flex justify-content-between align-items-center p-4 border-0 text-start" 
                  type="button" 
                  onClick={() => toggleAccordion(index)}
                  style={{ 
                    outline: 'none', 
                    boxShadow: 'none', 
                    background: 'transparent',
                    color: isOpen ? '#b91c1c' : '#1e293b',
                    fontWeight: isOpen ? '600' : '500',
                    fontSize: '1rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span className="pe-3">{faq.question}</span>
                  <div 
                    className="d-flex align-items-center justify-content-center rounded-circle" 
                    style={{ 
                      width: '28px', 
                      height: '28px', 
                      backgroundColor: isOpen ? 'rgba(185, 28, 28, 0.1)' : 'rgba(0,0,0,0.05)',
                      flexShrink: 0
                    }}
                  >
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </div>
                </button>
              </h2>
              <div className={`accordion-collapse collapse ${isOpen ? 'show' : ''}`}>
                <div className="accordion-body px-4 pb-4 pt-1 text-secondary" style={{ lineHeight: '1.7', fontSize: '0.95rem' }}>
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