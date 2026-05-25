def clean_location(parts):
    cleaned = [
        str(p).strip()
        for p in parts
        if p
        and str(p).strip() != ''
        and str(p).lower() not in ['none','undefined','null','nan','n/a']
    ]
    return ', '.join(cleaned) if cleaned else 'India'
