'use client';

import { useEffect, useRef } from 'react';
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from 'use-places-autocomplete';

export default function AddressAutocomplete({ 
    value, 
    onChange, 
    placeholder, 
    className,
    onLocationSelect 
}) {
    const {
        ready,
        value: inputValue,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            // Priority for Nigerian results
            componentRestrictions: { country: 'ng' },
        },
        debounce: 300,
        defaultValue: value
    });

    const handleInput = (e) => {
        setValue(e.target.value);
        onChange({ target: { name: 'address', value: e.target.value } });
    };

    const handleSelect = async (suggestion) => {
        const { description } = suggestion;
        setValue(description, false);
        clearSuggestions();

        // Pass selection to parent
        onChange({ target: { name: 'address', value: description } });

        try {
            const results = await getGeocode({ address: description });
            const { lat, lng } = await getLatLng(results[0]);
            
            if (onLocationSelect) {
                onLocationSelect({ lat, lng });
            }
        } catch (error) {
            console.error('Error fetching geocode:', error);
        }
    };

    return (
        <div className="autocomplete-container" style={{ position: 'relative' }}>
            <input
                value={inputValue}
                onChange={handleInput}
                disabled={!ready}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />
            {status === 'OK' && (
                <ul className="autocomplete-suggestions" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 1000,
                    padding: 'var(--space-2) 0',
                    margin: 'var(--space-1) 0 0 0',
                    listStyle: 'none'
                }}>
                    {data.map((suggestion) => (
                        <li
                            key={suggestion.place_id}
                            onClick={() => handleSelect(suggestion)}
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                cursor: 'pointer',
                                fontSize: 'var(--text-sm)',
                                borderBottom: '1px solid var(--bg-secondary)',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            <strong>{suggestion.structured_formatting.main_text}</strong>{' '}
                            <small className="text-muted">{suggestion.structured_formatting.secondary_text}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
