"""Simple fire risk calculations."""
from __future__ import annotations

def calculate_fire_risk(temp_celsius: float, humidity_percent: float) -> str:
    """Return fire risk level based on temperature and humidity.

    Parameters
    ----------
    temp_celsius : float
        Temperature in degrees Celsius.
    humidity_percent : float
        Relative humidity percentage.

    Returns
    -------
    str
        "Low", "Medium", or "High" depending on thresholds.
    """
    if temp_celsius < 30 or humidity_percent > 60:
        return "Low"
    if temp_celsius < 40 or humidity_percent > 30:
        return "Medium"
    return "High"
