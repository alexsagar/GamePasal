import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import './MaskedSecret.css';

const MaskedSecret = ({
    label,
    value,
    maskFormat = 'default',
    requireConfirm = false,
    onReveal
}) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [copied, setCopied] = useState(false);

    // Generate masked version
    const getMaskedValue = () => {
        if (!value) return 'No value available';

        if (maskFormat === 'password') {
            return value.charAt(0) + '*'.repeat(Math.max(4, value.length - 2)) + value.charAt(value.length - 1);
        }

        if (maskFormat === 'redeem') {
            // Assuming typical format like XXXX-XXXX-XXXX-XXXX
            const parts = value.split('-');
            if (parts.length > 1) {
                return parts.map((part, index) =>
                    (index === 0 || index === parts.length - 1) ? part : '****'
                ).join('-');
            }
            return value.substring(0, 4) + '-****-****-' + value.substring(Math.max(0, value.length - 4));
        }

        return '*'.repeat(8);
    };

    const handleToggleReveal = () => {
        if (!isRevealed && requireConfirm) {
            if (!window.confirm(`Are you sure you want to reveal ${label}?`)) {
                return;
            }
        }

        const newState = !isRevealed;
        setIsRevealed(newState);

        if (newState && onReveal) {
            onReveal();
        }
    };

    const handleCopy = async () => {
        if (!isRevealed || !value) return;
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="masked-secret-container">
            {label && <span className="masked-secret-label">{label}</span>}

            <div className={`masked-secret-box ${isRevealed ? 'revealed' : 'masked'}`}>
                <span className="secret-value">
                    {isRevealed ? value : getMaskedValue()}
                </span>

                <div className="secret-actions">
                    <button
                        type="button"
                        className="action-btn toggle-btn"
                        onClick={handleToggleReveal}
                        title={isRevealed ? "Hide" : "Reveal"}
                    >
                        {isRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
                        <span className="btn-text">{isRevealed ? 'Hide' : 'Reveal'}</span>
                    </button>

                    <button
                        type="button"
                        className={`action-btn copy-btn ${copied ? 'copied' : ''}`}
                        onClick={handleCopy}
                        disabled={!isRevealed}
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaskedSecret;
