from django.urls import re_path
from api.views import (
    auth_views,
    prediction_views,
    doctor_views,
    appointment_views,
    doctor_portal_views,
    admin_views,
    patient_views,
    common_views,
)

urlpatterns = [
    # Health and root
    re_path(r"^$", common_views.root_view, name="root"),
    re_path(r"^health/?$", common_views.health_check, name="health_check"),
    re_path(r"^analyze/?$", common_views.analyze_skin, name="analyze_skin"),

    # Auth
    re_path(r"^api/auth/register/patient/?$", auth_views.register_patient, name="register_patient"),
    re_path(r"^api/auth/register/doctor/?$", auth_views.register_doctor, name="register_doctor"),
    re_path(r"^api/auth/login/?$", auth_views.login, name="login"),
    re_path(r"^api/auth/me/profile/?$", auth_views.get_profile, name="get_profile"),

    # Predictions
    re_path(r"^api/predict/upload/?$", prediction_views.upload_and_predict, name="upload_and_predict"),
    re_path(r"^api/predictions/?$", prediction_views.get_predictions, name="get_predictions"),
    re_path(r"^api/predictions/(?P<prediction_id>[^/]+)/?$", prediction_views.get_prediction, name="get_prediction"),

    # Doctors
    re_path(r"^api/doctors/?$", doctor_views.list_doctors, name="list_doctors"),
    re_path(r"^api/doctors/profile/?$", doctor_views.doctor_profile, name="doctor_profile"),
    re_path(r"^api/doctors/(?P<doctor_id>[^/]+)/availability/?$", doctor_views.get_availability, name="doctor_availability"),
    re_path(r"^api/doctors/(?P<doctor_id>[^/]+)/?$", doctor_views.get_doctor, name="get_doctor"),
    re_path(r"^api/doctors/appointments/(?P<appointment_id>[^/]+)/complete/?$", doctor_views.complete_doctor_appointment, name="complete_doctor_appointment"),

    # Appointments
    re_path(r"^api/appointments/?$", appointment_views.book_appointment, name="book_appointment"),
    re_path(r"^api/appointments/with-image/?$", appointment_views.book_appointment_with_image, name="book_appointment_with_image"),
    re_path(r"^api/appointments/debug/all/?$", appointment_views.debug_all_appointments, name="debug_all_appointments"),
    re_path(r"^api/appointments/patient/?$", appointment_views.get_patient_appointments, name="patient_appointments"),
    re_path(r"^api/appointments/doctor/?$", appointment_views.get_doctor_appointments, name="doctor_appointments"),
    re_path(r"^api/appointments/(?P<appointment_id>[^/]+)/cancel/?$", appointment_views.cancel_appointment, name="cancel_appointment"),
    re_path(r"^api/appointments/(?P<appointment_id>[^/]+)/complete/?$", appointment_views.complete_appointment, name="complete_appointment"),
    re_path(r"^api/appointments/(?P<appointment_id>[^/]+)/consultation/?$", appointment_views.add_consultation, name="add_consultation"),

    # Doctor Portal
    re_path(r"^api/doctor/schedule/?$", doctor_portal_views.schedule, name="doctor_schedule"),
    re_path(r"^api/doctor/block-slots/?$", doctor_portal_views.block_slots, name="doctor_block_slots"),
    re_path(r"^api/doctor/clinic/?$", doctor_portal_views.update_clinic, name="doctor_update_clinic"),
    re_path(r"^api/doctor/patients/?$", doctor_portal_views.get_doctor_patients, name="doctor_patients"),
    re_path(r"^api/doctor/dashboard-stats/?$", doctor_portal_views.get_dashboard_stats, name="doctor_dashboard_stats"),

    # Admin Portal
    re_path(r"^api/admin/stats/?$", admin_views.get_stats, name="admin_stats"),
    re_path(r"^api/admin/doctors/pending/?$", admin_views.get_pending_doctors, name="admin_pending_doctors"),
    re_path(r"^api/admin/doctors/all/?$", admin_views.get_all_doctors, name="admin_all_doctors"),
    re_path(r"^api/admin/doctors/(?P<doctor_id>[^/]+)/approve/?$", admin_views.approve_doctor, name="admin_approve_doctor"),
    re_path(r"^api/admin/doctors/(?P<doctor_id>[^/]+)/reject/?$", admin_views.reject_doctor, name="admin_reject_doctor"),
    re_path(r"^api/admin/users/(?P<user_id>[^/]+)/block/?$", admin_views.toggle_block_user, name="admin_block_user"),
    re_path(r"^api/admin/patients/?$", admin_views.get_all_patients, name="admin_patients"),

    # Patient Portal
    re_path(r"^api/patient/profile/?$", patient_views.patient_profile, name="patient_profile"),
    re_path(r"^api/patient/medical-history/?$", patient_views.get_medical_history, name="patient_medical_history"),
]
