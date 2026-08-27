-- DropForeignKey
ALTER TABLE "public"."UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."userData" DROP CONSTRAINT "userData_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."userData" DROP CONSTRAINT "userData_modifiedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."userInternalCertifications" DROP CONSTRAINT "userInternalCertifications_UserID_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserExternalCertifications" DROP CONSTRAINT "UserExternalCertifications_UserID_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserExternalCertifications" DROP CONSTRAINT "UserExternalCertifications_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserExternalCertifications" DROP CONSTRAINT "UserExternalCertifications_modifiedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserAdditionalDetails" DROP CONSTRAINT "UserAdditionalDetails_UserID_fkey";

-- DropForeignKey
ALTER TABLE "public"."CreatedPTWs" DROP CONSTRAINT "CreatedPTWs_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."AddProject" DROP CONSTRAINT "AddProject_MarketCountryID_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssignedSubcon" DROP CONSTRAINT "AssignedSubcon_UserID_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssignedSubcon" DROP CONSTRAINT "AssignedSubcon_ProjectID_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssignedSubcon" DROP CONSTRAINT "AssignedSubcon_SubconID_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserRoleCertificationStatus" DROP CONSTRAINT "UserRoleCertificationStatus_userId_fkey";

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."Role";

-- DropTable
DROP TABLE "public"."UserRole";

-- DropTable
DROP TABLE "public"."userData";

-- DropTable
DROP TABLE "public"."userInternalCertifications";

-- DropTable
DROP TABLE "public"."UserExternalCertifications";

-- DropTable
DROP TABLE "public"."UserAdditionalDetails";

-- DropTable
DROP TABLE "public"."PTWDATA";

-- DropTable
DROP TABLE "public"."CreatedPTWs";

-- DropTable
DROP TABLE "public"."MarketCountry";

-- DropTable
DROP TABLE "public"."AddProject";

-- DropTable
DROP TABLE "public"."SubconCompany";

-- DropTable
DROP TABLE "public"."AssignedSubcon";

-- DropTable
DROP TABLE "public"."RoleCertificationRequirement";

-- DropTable
DROP TABLE "public"."UserRoleCertificationStatus";

-- DropTable
DROP TABLE "public"."staging_users";

-- DropTable
DROP TABLE "public"."stg_certusers";

