import frappe

@frappe.whitelist()
def user_permission(user):
    frappe.msgprint(f"hello")
    # if not user:
    #     user = frappe.session.user

    # if user == "Administrator":
    #     frappe.msgprint(f"hello")
    #     return ""

    # frappe.msgprint(f"hello")
    # raven_users = frappe.get_all("Accepted Application", {"customer": user}, ["freelancer"])

    # frappe.msgprint(f"{raven_users}")
    # return f"(`tabRaven User`.user IN ({raven_users}))"

    # if "PHA Hospital Data Access" in roles and len(users) > 0:
    #     return f"(`tabUser`.name IN ({users}))"

    # return f"(`tabUser`.name = '{user}')"
