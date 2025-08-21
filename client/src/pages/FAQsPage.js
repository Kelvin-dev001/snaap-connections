import React from 'react';
import { Container, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqs = [
  {
    question: "How do I place an order?",
    answer: "Browse products, add items to your cart, and follow checkout instructions. For help, contact us via WhatsApp or phone."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept MPesa, credit/debit cards, and cash on delivery in select areas."
  },
  {
    question: "How long does delivery take?",
    answer: "Delivery in Mombasa is same-day. Other locations across Kenya typically take 1-3 business days."
  },
  {
    question: "Can I return or exchange a product?",
    answer: "Yes! See our Returns Policy for details. Contact us within 7 days of delivery for assistance."
  },
  {
    question: "Do you offer warranty?",
    answer: "Most products come with official manufacturer warranty. For specific warranty info, check the product details."
  },
];

const FAQsPage = () => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Typography variant="h4" fontWeight={800} mb={3} color="primary.main">
      Frequently Asked Questions
    </Typography>
    {faqs.map((faq, idx) => (
      <Accordion key={idx} sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600}>{faq.question}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography color="text.secondary">{faq.answer}</Typography>
        </AccordionDetails>
      </Accordion>
    ))}
  </Container>
);

export default FAQsPage;