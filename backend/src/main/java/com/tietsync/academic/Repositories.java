package com.tietsync.academic;
import org.springframework.data.jpa.repository.*; import java.util.*;
interface UserRepository extends JpaRepository<UserAccount,UUID>{ Optional<UserAccount> findByEmailIgnoreCase(String email); List<UserAccount> findByRole(Role role); }
interface ClassroomRepository extends JpaRepository<Classroom,UUID>{ List<Classroom> findByCodeContainingIgnoreCaseOrNameContainingIgnoreCase(String code,String name); }
interface AssignmentRepository extends JpaRepository<Assignment,UUID>{ List<Assignment> findByOwnerIdOrderByDueDateAsc(UUID ownerId); }
interface AttendanceRepository extends JpaRepository<AttendanceRecord,UUID>{ List<AttendanceRecord> findByStudentId(UUID studentId); }
interface EventRepository extends JpaRepository<AcademicEvent,UUID>{ List<AcademicEvent> findAllByOrderByEventDateAsc(); }
interface ResourceRepository extends JpaRepository<Resource,UUID>{ List<Resource> findBySubjectContainingIgnoreCaseOrTitleContainingIgnoreCase(String subject,String title); }
interface SlotRepository extends JpaRepository<ConsultationSlot,UUID>{ List<ConsultationSlot> findByFacultyIdAndAvailableTrue(UUID facultyId); }
interface ConsultationRepository extends JpaRepository<ConsultationRequest,UUID>{ List<ConsultationRequest> findByStudentIdOrderByCreatedAtDesc(UUID studentId); List<ConsultationRequest> findByFacultyIdOrderByCreatedAtDesc(UUID facultyId); }
interface ScheduleRepository extends JpaRepository<ClassSchedule,UUID>{ List<ClassSchedule> findByOwnerId(UUID ownerId); }
