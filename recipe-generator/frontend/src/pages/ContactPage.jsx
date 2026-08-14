import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function ContactPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.post(`${API_URL}/contact`, form);

            alert("Your query has been submitted successfully!");

            setForm({
                name: "",
                email: "",
                subject: "",
                message: "",
            });
        } catch (err) {
            alert("Failed to send query.");
        }
    };

    return (
        <div className="contact-page">
            <form onSubmit={handleSubmit} className="contact-form">
                <h2>Contact Us</h2>
                <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="subject"
                    placeholder="Subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                />

                <textarea
                    name="message"
                    placeholder="Write your query..."
                    rows="6"
                    value={form.message}
                    onChange={handleChange}
                    required
                />

                <button type="submit">
                    Send Query
                </button>

            </form>
        </div>
    );
}

export default ContactPage;