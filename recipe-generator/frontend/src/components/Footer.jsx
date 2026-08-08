import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <Link to="/">Home</Link>
        <Link to="/contact">Contact Us</Link>
        <Link to="/reviews">Reviews</Link>
      </div>

      <p className="footer-text">
        © 2026 ChefGpt. All Rights Reserved.
      </p>

      <p className="footer-thanks">
        Thank you for visiting us ❤️
      </p>
    </footer>
  );
}

export default Footer;