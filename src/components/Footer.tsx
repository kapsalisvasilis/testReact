// Footer.tsx
const Footer = () => {
    return (
        <footer style={{
            backgroundColor: '#22c55e', // <-- Changed to green
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            borderTop: '1px solid #e2e8f0',
            color: 'white' // <-- Added white text for better contrast
        }}>
            <div style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #ffffff, #f0f0f0)', // <-- Updated gradient for visibility
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                 We used an open library and we are open about it
            </div>
        </footer>
    );
};

export default Footer;