import firewatch


def test_low_risk_due_to_humidity():
    assert firewatch.calculate_fire_risk(35, 80) == "Low"


def test_medium_risk():
    assert firewatch.calculate_fire_risk(35, 40) == "Medium"


def test_high_risk():
    assert firewatch.calculate_fire_risk(45, 20) == "High"
