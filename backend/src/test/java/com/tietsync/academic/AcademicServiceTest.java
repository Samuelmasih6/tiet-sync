package com.tietsync.academic;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AcademicServiceTest {
  @Mock private UserRepository users;
  @Mock private AssignmentRepository assignments;
  @Mock private AttendanceRepository attendance;
  @Mock private SlotRepository slots;
  @Mock private ConsultationRepository consultations;
  @Mock private PasswordEncoder encoder;
  private AcademicService service;
  private UserAccount student;
  private UserAccount faculty;

  @BeforeEach
  void setUp() {
    service = new AcademicService(users, assignments, attendance, slots, consultations, encoder);
    student = user(Role.STUDENT);
    faculty = user(Role.FACULTY);
  }

  @Test
  void attendanceAdditionalClassesUsesSpecifiedFormula() {
    assertEquals(3, service.additionalClasses(18, 25));
    assertEquals(0, service.additionalClasses(22, 28));
    assertEquals(0, service.additionalClasses(0, 0));
  }

  @Test
  void studentCanBookAnAvailableSlot() {
    ConsultationSlot slot = slot(true);
    when(users.findById(student.id)).thenReturn(Optional.of(student));
    when(slots.findById(slot.id)).thenReturn(Optional.of(slot));
    when(consultations.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    ConsultationRequest request = service.book(student.id, slot.id, "Discuss course plan");

    assertEquals(RequestStatus.PENDING, request.status);
    assertSame(student, request.student);
    assertSame(faculty, request.faculty);
    assertFalse(slot.available);
    verify(consultations).save(request);
  }

  @Test
  void facultyCannotCreateAStudentConsultationRequest() {
    when(users.findById(faculty.id)).thenReturn(Optional.of(faculty));

    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> service.book(faculty.id, UUID.randomUUID(), "Attempted booking"));

    assertEquals("Only students can create consultation requests", exception.getMessage());
    verifyNoInteractions(slots, consultations);
  }

  @Test
  void requestingStudentCanCancelPendingRequestAndReleaseSlot() {
    ConsultationSlot slot = slot(false);
    ConsultationRequest request = request(slot, RequestStatus.PENDING);
    when(users.findById(student.id)).thenReturn(Optional.of(student));
    when(consultations.findById(request.id)).thenReturn(Optional.of(request));

    ConsultationRequest cancelled = service.cancel(student.id, request.id);

    assertSame(request, cancelled);
    assertEquals(RequestStatus.CANCELLED, request.status);
    assertTrue(slot.available);
  }

  @Test
  void onlyAssignedFacultyCanRejectAndReleaseSlot() {
    ConsultationSlot slot = slot(false);
    ConsultationRequest request = request(slot, RequestStatus.PENDING);
    when(users.findById(faculty.id)).thenReturn(Optional.of(faculty));
    when(consultations.findById(request.id)).thenReturn(Optional.of(request));

    ConsultationRequest rejected = service.decide(faculty.id, request.id, RequestStatus.REJECTED);

    assertSame(request, rejected);
    assertEquals(RequestStatus.REJECTED, request.status);
    assertTrue(slot.available);
  }

  @Test
  void studentCannotDecideConsultationRequest() {
    when(users.findById(student.id)).thenReturn(Optional.of(student));

    IllegalArgumentException exception = assertThrows(
        IllegalArgumentException.class,
        () -> service.decide(student.id, UUID.randomUUID(), RequestStatus.APPROVED));

    assertEquals("Only faculty can decide consultation requests", exception.getMessage());
    verifyNoInteractions(consultations);
  }

  private UserAccount user(Role role) {
    UserAccount user = new UserAccount();
    user.id = UUID.randomUUID();
    user.role = role;
    user.fullName = role == Role.STUDENT ? "Student" : "Faculty";
    return user;
  }

  private ConsultationSlot slot(boolean available) {
    ConsultationSlot slot = new ConsultationSlot();
    slot.id = UUID.randomUUID();
    slot.faculty = faculty;
    slot.slotDate = LocalDate.now().plusDays(1);
    slot.startTime = LocalTime.of(15, 0);
    slot.endTime = LocalTime.of(15, 20);
    slot.available = available;
    return slot;
  }

  private ConsultationRequest request(ConsultationSlot slot, RequestStatus status) {
    ConsultationRequest request = new ConsultationRequest();
    request.id = UUID.randomUUID();
    request.student = student;
    request.faculty = faculty;
    request.slot = slot;
    request.status = status;
    return request;
  }
}
