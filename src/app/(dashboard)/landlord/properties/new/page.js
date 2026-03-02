'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, ArrowLeft, ArrowRight } from 'lucide-react';
import styles from './new-property.module.css';
import dashStyles from '../../../tenant/dashboard.module.css';

const PROPERTY_TYPES = [
    { value: 'SELF_CON', label: 'Self Contained' },
    { value: 'SINGLE_ROOM', label: 'Single Room' },
    { value: 'FLAT', label: 'Flat' },
    { value: 'TWO_BEDROOM', label: '2 Bedroom' },
    { value: 'THREE_BEDROOM', label: '3 Bedroom' },
];

const AREAS = [
    { value: 'TANKE', label: 'Tanke' },
    { value: 'BASIN', label: 'Basin' },
    { value: 'MALETE', label: 'Malete' },
    { value: 'OTHER', label: 'Other' },
];

const AMENITIES_OPTIONS = [
    'Water', 'Electricity', 'Security', 'Parking', 'Tiled Floor',
    'POP Ceiling', 'Wardrobe', 'Kitchen', 'Bathroom', 'Toilet',
    'Fence', 'Gate', 'Borehole', 'Generator', 'WiFi Ready',
];

export default function NewPropertyPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [location, setLocation] = useState(null);
    const [locationError, setLocationError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        rentPrice: '',
        type: '',
        address: '',
        area: '',
        amenities: [],
        studentFriendly: false,
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
        setError('');
    };

    const toggleAmenity = (amenity) => {
        setFormData({
            ...formData,
            amenities: formData.amenities.includes(amenity)
                ? formData.amenities.filter(a => a !== amenity)
                : [...formData.amenities, amenity],
        });
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 10) {
            setError('Maximum 10 images allowed');
            return;
        }

        // Request location for geofencing verification before processing images
        if (navigator.geolocation && !location) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                    setLocationError('');
                    processSelectedFiles(files);
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    setLocationError('Location access denied. Property will be marked for strict manual review.');
                    processSelectedFiles(files); // Still process files, but flag as suspicious later
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            // Location already acquired or not supported
            processSelectedFiles(files);
        }
    };

    const processSelectedFiles = (files) => {
        setImages(prev => [...prev, ...files]);

        // Generate previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Step 1: Create property
            const res = await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    rentPrice: parseFloat(formData.rentPrice),
                    uploadLatitude: location?.latitude || null,
                    uploadLongitude: location?.longitude || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to create property');
                setLoading(false);
                return;
            }

            // Step 2: Upload images
            if (images.length > 0) {
                const imageForm = new FormData();
                images.forEach(img => imageForm.append('images', img));
                imageForm.append('isPrimary', 'true');

                await fetch(`/api/properties/${data.property.id}/images`, {
                    method: 'POST',
                    body: imageForm,
                });
            }

            setSuccess('Property created! It will be reviewed by our verification team.');
            setTimeout(() => router.push('/landlord/properties'), 2000);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const serviceFee = formData.rentPrice ? (parseFloat(formData.rentPrice) * 0.1).toLocaleString() : '0';
    const totalPayable = formData.rentPrice ? (parseFloat(formData.rentPrice) * 1.1).toLocaleString() : '0';

    return (
        <div className="fade-in">
            <div className={dashStyles.welcomeSection}>
                <h2>Add New Property</h2>
                <p className="text-muted">Fill in the details to list your property on Renta</p>
            </div>

            {/* Progress Steps */}
            <div className={styles.progressSteps}>
                <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''}`}>
                    <span className={styles.stepNum}>1</span>
                    <span>Details</span>
                </div>
                <div className={styles.progressLine}></div>
                <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''}`}>
                    <span className={styles.stepNum}>2</span>
                    <span>Photos</span>
                </div>
                <div className={styles.progressLine}></div>
                <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`}>
                    <span className={styles.stepNum}>3</span>
                    <span>Review</span>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {error && <div className={styles.errorAlert}>{error}</div>}
                {success && <div className={styles.successAlert}>{success}</div>}

                {/* Step 1: Property Details */}
                {step === 1 && (
                    <div className={`card ${styles.formSection}`}>
                        <h4 className={styles.sectionLabel}>Property Details</h4>

                        <div className="form-group">
                            <label htmlFor="title" className="form-label">Property Title</label>
                            <input
                                id="title" name="title" className="form-input"
                                placeholder="e.g. Spacious Self-Con at Tanke"
                                value={formData.title} onChange={handleChange} required
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="form-group flex-1">
                                <label htmlFor="type" className="form-label">Property Type</label>
                                <select id="type" name="type" className="form-input"
                                    value={formData.type} onChange={handleChange} required>
                                    <option value="">Select type</option>
                                    {PROPERTY_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group flex-1">
                                <label htmlFor="area" className="form-label">Area</label>
                                <select id="area" name="area" className="form-input"
                                    value={formData.area} onChange={handleChange} required>
                                    <option value="">Select area</option>
                                    {AREAS.map(a => (
                                        <option key={a.value} value={a.value}>{a.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="address" className="form-label">Full Address</label>
                            <input
                                id="address" name="address" className="form-input"
                                placeholder="e.g. Beside UniIlorin Gate, Tanke Road"
                                value={formData.address} onChange={handleChange} required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="rentPrice" className="form-label">Annual Rent (₦)</label>
                            <input
                                id="rentPrice" name="rentPrice" type="number" className="form-input"
                                placeholder="e.g. 150000"
                                value={formData.rentPrice} onChange={handleChange} required min="1"
                            />
                            {formData.rentPrice && (
                                <span className="form-help">
                                    Tenant pays: ₦{totalPayable} (₦{Number(formData.rentPrice).toLocaleString()} + ₦{serviceFee} service fee)
                                </span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="description" className="form-label">Description</label>
                            <textarea
                                id="description" name="description" className="form-input"
                                placeholder="Describe the property, nearby landmarks, features..."
                                value={formData.description} onChange={handleChange} required
                                rows={4}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Amenities</label>
                            <div className={styles.amenitiesGrid}>
                                {AMENITIES_OPTIONS.map(amenity => (
                                    <label key={amenity} className={styles.amenityChip}>
                                        <input
                                            type="checkbox"
                                            checked={formData.amenities.includes(amenity)}
                                            onChange={() => toggleAmenity(amenity)}
                                        />
                                        <span>{amenity}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox" name="studentFriendly"
                                checked={formData.studentFriendly}
                                onChange={handleChange}
                            />
                            <span>Student-Friendly Property</span>
                        </label>

                        <div className={styles.formActions}>
                            <button type="button" className="btn btn-primary btn-lg" onClick={() => {
                                if (!formData.title || !formData.type || !formData.area || !formData.address || !formData.rentPrice || !formData.description) {
                                    setError('Please fill in all required fields');
                                    return;
                                }
                                setStep(2);
                            }}>
                                Next: Add Photos →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Photos */}
                {step === 2 && (
                    <div className={`card ${styles.formSection}`}>
                        <h4 className={styles.sectionLabel}>Property Photos</h4>
                        <p className="text-muted text-sm mb-4">Upload up to 10 photos. The first photo will be the cover image.</p>

                        {locationError && (
                            <div className="card mb-4" style={{ background: 'var(--color-error-light)', borderLeft: '4px solid var(--color-error)', padding: 'var(--space-2) var(--space-4)' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--color-error)' }}>{locationError}</p>
                            </div>
                        )}

                        <div className={styles.imageUpload}>
                            <input
                                type="file" id="images" accept="image/*" multiple
                                onChange={handleImageSelect}
                                className={styles.fileInput}
                            />
                            <label htmlFor="images" className={styles.uploadArea}>
                                <span className={styles.uploadIcon}><Camera size={32} /></span>
                                <span>Click to select photos</span>
                                <span className="text-xs text-muted">PNG, JPG up to 5MB each</span>
                            </label>
                        </div>

                        {previews.length > 0 && (
                            <div className={styles.previewGrid}>
                                {previews.map((preview, index) => (
                                    <div key={index} className={styles.previewItem}>
                                        <img src={preview} alt={`Preview ${index + 1}`} />
                                        {index === 0 && <span className={styles.coverBadge}>Cover</span>}
                                        <button type="button" className={styles.removeBtn}
                                            onClick={() => removeImage(index)}><X size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.formActions}>
                            <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                                <span className="flex items-center gap-2"><ArrowLeft size={16} /> Back</span>
                            </button>
                            <button type="button" className="btn btn-primary btn-lg" onClick={() => setStep(3)}>
                                <span className="flex items-center gap-2">Next: Review <ArrowRight size={16} /></span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                    <div className={`card ${styles.formSection}`}>
                        <h4 className={styles.sectionLabel}>Review Your Listing</h4>

                        <div className={styles.reviewGrid}>
                            <div className={styles.reviewItem}>
                                <span className="text-muted text-sm">Title</span>
                                <strong>{formData.title}</strong>
                            </div>
                            <div className={styles.reviewItem}>
                                <span className="text-muted text-sm">Type</span>
                                <strong>{PROPERTY_TYPES.find(t => t.value === formData.type)?.label}</strong>
                            </div>
                            <div className={styles.reviewItem}>
                                <span className="text-muted text-sm">Area</span>
                                <strong>{AREAS.find(a => a.value === formData.area)?.label}</strong>
                            </div>
                            <div className={styles.reviewItem}>
                                <span className="text-muted text-sm">Address</span>
                                <strong>{formData.address}</strong>
                            </div>
                            <div className={styles.reviewItem}>
                                <span className="text-muted text-sm">Annual Rent</span>
                                <strong className="text-primary-color">₦{Number(formData.rentPrice).toLocaleString()}</strong>
                            </div>
                            <div className={styles.reviewItem}>
                                <span className="text-muted text-sm">Photos</span>
                                <strong>{images.length} image(s)</strong>
                            </div>
                        </div>

                        {formData.amenities.length > 0 && (
                            <div className={styles.reviewItem} style={{ marginTop: 'var(--space-4)' }}>
                                <span className="text-muted text-sm">Amenities</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {formData.amenities.map(a => (
                                        <span key={a} className="badge badge-primary">{a}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.priceBreakdown}>
                            <h5>Tenant Price Breakdown</h5>
                            <div className={styles.breakdownRow}>
                                <span>Your Rent</span>
                                <span>₦{Number(formData.rentPrice).toLocaleString()}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                                <span>Platform Fee (10%)</span>
                                <span>₦{serviceFee}</span>
                            </div>
                            <div className={`${styles.breakdownRow} ${styles.breakdownTotal}`}>
                                <span>Tenant Pays</span>
                                <span>₦{totalPayable}</span>
                            </div>
                            <p className="text-xs text-muted mt-2">You receive ₦{Number(formData.rentPrice).toLocaleString()} — the full rent amount.</p>
                        </div>

                        <div className={styles.formActions}>
                            <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>
                                ← Back
                            </button>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="spinner"></span>
                                        Submitting...
                                    </span>
                                ) : (
                                    'Submit for Verification'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
