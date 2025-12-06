"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Badge,
  Group,
  TextInput,
  Loader,
  Center,
  Stack,
  ThemeIcon,
  Tabs,
  Box,
  Button,
  Modal,
  Accordion,
  ActionIcon,
  Select,
  NumberInput,
  Textarea,
} from "@mantine/core";
import {
  IconSearch,
  IconFolder,
  IconFolderOpen,
  IconUpload,
  IconBrandGoogleDrive,
  IconFileText,
  IconBook,
  IconSchool,
  IconLink,
  IconArrowRight,
} from "@tabler/icons-react";
import { useAuth } from "@/components/AuthProvider";
import { useDisclosure } from "@mantine/hooks";
import { showError, showSuccess } from "@/lib/error-handling";
import { getAuthHeaders } from "@/lib/api";

interface SubjectResource {
  _id: string;
  courseCode: string;
  courseName: string;
  year: number;
  branch: string;
  syllabus?: { linkUrl: string; description?: string };
  modules: { moduleNumber: number; title: string; linkUrl: string }[];
  pyqs: { exam: string; year: string; linkUrl: string }[];
  others: { title: string; linkUrl: string }[];
}

export default function ResourcesPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [resources, setResources] = useState<SubjectResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>("all");

  // Placeholder Drive Links
  const DRIVE_LINKS: Record<string, string> = {
    "1": "https://drive.google.com/drive/folders/YOUR_1ST_YEAR_FOLDER_ID",
    "2,3":
      "https://drive.google.com/drive/folders/YOUR_2ND_AND_3RD_YEAR_FOLDER_ID",
    "4": "https://drive.google.com/drive/folders/YOUR_4TH_YEAR_FOLDER_ID",
    all: "https://drive.google.com/drive/folders/YOUR_MAIN_FOLDER_ID",
  };

  const [previewOpened, { open: openPreview, close: closePreview }] =
    useDisclosure(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    courseCode: "",
    courseName: "",
    year: "1",
    branch: "",
    category: "NOTES",
    title: "",
    linkUrl: "",
    moduleNumber: 1,
    exam: "CAT1",
    examYear: new Date().getFullYear().toString(),
    description: "",
  });

  const handleUpload = async () => {
    if (!uploadForm.courseCode || !uploadForm.linkUrl || !uploadForm.title) {
      showError(
        { message: "Please fill all required fields" },
        "Validation Error"
      );
      return;
    }

    setUploading(true);
    try {
      const item: any = {
        linkUrl: uploadForm.linkUrl,
        title: uploadForm.title,
      };

      if (uploadForm.category === "NOTES") {
        item.moduleNumber = uploadForm.moduleNumber;
      } else if (uploadForm.category === "PYQ") {
        item.exam = uploadForm.exam;
        item.year = uploadForm.examYear;
      } else if (uploadForm.category === "SYLLABUS") {
        item.description = uploadForm.description;
      } else {
        item.description = uploadForm.description;
      }

      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: uploadForm.courseCode,
          courseName: uploadForm.courseName,
          year: parseInt(uploadForm.year),
          branch: uploadForm.branch,
          category: uploadForm.category,
          item,
          userId: profile?._id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showSuccess(
          "Resource uploaded successfully! It is currently pending admin approval."
        );
        setUploadModalOpen(false);
        setUploadForm({
          courseCode: "",
          courseName: "",
          year: "1",
          branch: "",
          category: "NOTES",
          title: "",
          linkUrl: "",
          moduleNumber: 1,
          exam: "CAT1",
          examYear: new Date().getFullYear().toString(),
          description: "",
        });
        fetchResources(activeTab);
      } else {
        showError({ message: data.error || "Upload failed" }, "Error");
      }
    } catch (error) {
      showError(error, "Upload Failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchResources(activeTab);
  }, [activeTab]);

  async function fetchResources(year: string | null = "all") {
    setLoading(true);
    try {
      let url = "/api/resources";
      if (year && year !== "all") {
        url += `?year=${encodeURIComponent(year)}`;
      }
      const res = await fetch(url, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.resources) {
        setResources(data.resources);
      } else {
        setResources([]);
      }
    } catch (error) {
      console.error("Failed to fetch resources", error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.courseName.toLowerCase().includes(search.toLowerCase()) ||
      r.courseCode.toLowerCase().includes(search.toLowerCase());

    if (activeTab === "all") return matchesSearch;

    const y = r.year;
    if (y === undefined || y === null) return false;

    if (activeTab && activeTab.includes(",")) {
      const years = activeTab.split(",").map(Number);
      return matchesSearch && years.includes(y);
    }

    return matchesSearch && String(y) === activeTab;
  });

  const handlePreview = (url: string, title: string) => {
    setPreviewUrl(url);
    setPreviewTitle(title);
    openPreview();
  };

  if (authLoading) {
    return (
      <>
        <Navbar />
        <Center h="calc(100vh - 60px)">
          <Loader />
        </Center>
      </>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <>
        <Navbar />
        <Container size="lg" py="xl">
          <div style={{ textAlign: "center", marginTop: "100px" }}>
            <Title order={2} mb="md">
              Resources
            </Title>
            <Text size="xl" c="dimmed">
              Coming Soon
            </Text>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box bg="var(--mantine-color-body)" style={{ minHeight: "100vh" }}>
        <Container size="xl" py="xl">
          <Stack gap="lg">
            <Card radius="lg" padding="xl" withBorder>
              <IconFolderOpen
                style={{
                  position: "absolute",
                  right: -20,
                  bottom: -20,
                  width: 200,
                  height: 200,
                  opacity: 0.05,
                  transform: "rotate(-10deg)",
                  color: "var(--mantine-color-blue-6)",
                }}
              />
              <Stack gap="xs" style={{ position: "relative", zIndex: 1 }}>
                <Title order={1} size="h2">
                  Resource Library
                </Title>
                <Text c="dimmed" maw={600}>
                  Access a comprehensive collection of course materials, notes,
                  and previous year questions. Organized by year and subject for
                  easy access.
                </Text>
              </Stack>
            </Card>

            <Group justify="space-between" align="center" wrap="wrap">
              <Tabs
                value={activeTab}
                onChange={setActiveTab}
                variant="pills"
                radius="xl"
                color="blue"
              >
                <Tabs.List>
                  <Tabs.Tab value="all">All Resources</Tabs.Tab>
                  <Tabs.Tab value="1">1st Year</Tabs.Tab>
                  <Tabs.Tab value="2,3">2nd & 3rd Year</Tabs.Tab>
                  <Tabs.Tab value="4">4th Year</Tabs.Tab>
                </Tabs.List>
              </Tabs>

              <Group>
                <TextInput
                  placeholder="Search subjects..."
                  leftSection={<IconSearch size={16} />}
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  radius="xl"
                  w={250}
                />
                <Button
                  leftSection={<IconUpload size={16} />}
                  radius="xl"
                  onClick={() => setUploadModalOpen(true)}
                >
                  Upload
                </Button>
              </Group>
            </Group>

            {loading ? (
              <Center h={200}>
                <Loader type="dots" />
              </Center>
            ) : (
              <>
                {activeTab && DRIVE_LINKS[activeTab] && (
                  <Card
                    withBorder
                    radius="md"
                    padding="md"
                    mb="lg"
                    bg="blue.0"
                    style={{ borderColor: "var(--mantine-color-blue-2)" }}
                  >
                    <Group justify="space-between">
                      <Group>
                        <ThemeIcon
                          size="lg"
                          radius="xl"
                          color="blue"
                          variant="light"
                        >
                          <IconBrandGoogleDrive size={20} />
                        </ThemeIcon>
                        <div>
                          <Text fw={600} size="sm">
                            Incomplete Materials?
                          </Text>
                          <Text size="xs" c="dimmed">
                            Access the full Google Drive folder for{" "}
                            {activeTab === "all"
                              ? "all years"
                              : activeTab === "2,3"
                              ? "2nd & 3rd Years"
                              : `Year ${activeTab}`}
                            .
                          </Text>
                        </div>
                      </Group>
                      <Button
                        component="a"
                        href={DRIVE_LINKS[activeTab]}
                        target="_blank"
                        variant="white"
                        color="blue"
                        leftSection={<IconBrandGoogleDrive size={16} />}
                      >
                        Open Drive Folder
                      </Button>
                    </Group>
                  </Card>
                )}

                {filteredResources.length === 0 ? (
                  <Center h={200}>
                    <Stack align="center" gap="xs">
                      <ThemeIcon
                        size={50}
                        radius="xl"
                        color="gray"
                        variant="light"
                      >
                        <IconFolder size={30} />
                      </ThemeIcon>
                      <Text c="dimmed">
                        No resources found matching your criteria.
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Accordion variant="separated" radius="md">
                    {filteredResources.map((subject) => (
                      <Accordion.Item
                        key={subject._id}
                        value={subject.courseCode}
                      >
                        <Accordion.Control
                          icon={
                            <IconBook
                              size={20}
                              color="var(--mantine-color-blue-6)"
                            />
                          }
                        >
                          <Group justify="space-between" w="100%" pr="md">
                            <div>
                              <Text fw={600}>{subject.courseName}</Text>
                              <Text size="xs" c="dimmed">
                                {subject.courseCode} • Year {subject.year}
                              </Text>
                            </div>
                            <Badge variant="light" color="gray">
                              {(subject.syllabus ? 1 : 0) +
                                subject.modules.length +
                                subject.pyqs.length +
                                subject.others.length}{" "}
                              items
                            </Badge>
                          </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                          <Stack gap="md">
                            {/* Syllabus Section */}
                            {subject.syllabus && (
                              <div>
                                <Group gap="xs" mb="xs">
                                  <IconFileText size={16} color="gray" />
                                  <Text
                                    size="sm"
                                    fw={600}
                                    tt="uppercase"
                                    c="dimmed"
                                  >
                                    Syllabus
                                  </Text>
                                </Group>
                                <SimpleGrid
                                  cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                                  spacing="md"
                                  verticalSpacing="md"
                                >
                                  <ResourceItemCard
                                    title="Syllabus"
                                    type="SYLLABUS"
                                    onClick={() =>
                                      handlePreview(
                                        subject.syllabus!.linkUrl,
                                        `${subject.courseName} Syllabus`
                                      )
                                    }
                                  />
                                </SimpleGrid>
                              </div>
                            )}

                            {/* Notes Section */}
                            {subject.modules.length > 0 && (
                              <div>
                                <Group gap="xs" mb="xs">
                                  <IconSchool size={16} color="gray" />
                                  <Text
                                    size="sm"
                                    fw={600}
                                    tt="uppercase"
                                    c="dimmed"
                                  >
                                    Notes
                                  </Text>
                                </Group>
                                <SimpleGrid
                                  cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                                  spacing="md"
                                  verticalSpacing="md"
                                >
                                  {subject.modules.map((mod, idx) => (
                                    <ResourceItemCard
                                      key={idx}
                                      title={`Module ${mod.moduleNumber}: ${mod.title}`}
                                      type="NOTES"
                                      onClick={() =>
                                        handlePreview(mod.linkUrl, mod.title)
                                      }
                                    />
                                  ))}
                                </SimpleGrid>
                              </div>
                            )}

                            {/* PYQ Section */}
                            {subject.pyqs.length > 0 && (
                              <div>
                                <Group gap="xs" mb="xs">
                                  <IconFolderOpen size={16} color="gray" />
                                  <Text
                                    size="sm"
                                    fw={600}
                                    tt="uppercase"
                                    c="dimmed"
                                  >
                                    Previous Year Questions (PYQ)
                                  </Text>
                                </Group>
                                <SimpleGrid
                                  cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                                  spacing="md"
                                  verticalSpacing="md"
                                >
                                  {subject.pyqs.map((pyq, idx) => (
                                    <ResourceItemCard
                                      key={idx}
                                      title={`${pyq.exam} ${pyq.year}`}
                                      type="PYQ"
                                      onClick={() =>
                                        handlePreview(
                                          pyq.linkUrl,
                                          `${pyq.exam} ${pyq.year}`
                                        )
                                      }
                                    />
                                  ))}
                                </SimpleGrid>
                              </div>
                            )}
                          </Stack>
                        </Accordion.Panel>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                )}
              </>
            )}
          </Stack>
        </Container>
      </Box>

      <Modal
        opened={previewOpened}
        onClose={() => {
          closePreview();
          setPreviewUrl("");
        }}
        title={previewTitle}
        size="xl"
        styles={{ body: { height: "80vh" } }}
      >
        {previewUrl && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <iframe
              src={getEmbedUrl(previewUrl)}
              style={{
                width: "100%",
                flex: 1,
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#f1f3f5",
              }}
              title={previewTitle}
            />
            <Group justify="flex-end" mt="md">
              <Button
                component="a"
                href={previewUrl}
                target="_blank"
                variant="outline"
                size="xs"
              >
                Open in New Tab
              </Button>
            </Group>
          </div>
        )}
      </Modal>

      <Modal
        opened={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Resource"
        size="lg"
      >
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Course Code"
              placeholder="e.g. CSE1001"
              required
              value={uploadForm.courseCode}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  courseCode: e.currentTarget.value.toUpperCase(),
                })
              }
            />
            <TextInput
              label="Course Name"
              placeholder="e.g. Problem Solving"
              value={uploadForm.courseName}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  courseName: e.currentTarget.value,
                })
              }
            />
          </Group>
          <Group grow>
            <Select
              label="Year"
              data={["1", "2", "3", "4"]}
              value={uploadForm.year}
              onChange={(val) =>
                setUploadForm({ ...uploadForm, year: val || "1" })
              }
              allowDeselect={false}
            />
            <TextInput
              label="Branch"
              placeholder="e.g. CSE (Optional)"
              value={uploadForm.branch}
              onChange={(e) =>
                setUploadForm({ ...uploadForm, branch: e.currentTarget.value })
              }
            />
          </Group>

          <Select
            label="Category"
            data={["NOTES", "PYQ", "SYLLABUS", "OTHER"]}
            value={uploadForm.category}
            onChange={(val) =>
              setUploadForm({ ...uploadForm, category: val || "NOTES" })
            }
            allowDeselect={false}
          />

          <TextInput
            label="Title"
            placeholder="Resource Title"
            required
            value={uploadForm.title}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, title: e.currentTarget.value })
            }
          />

          <TextInput
            label="Link URL"
            placeholder="Google Drive / YouTube Link"
            required
            value={uploadForm.linkUrl}
            onChange={(e) =>
              setUploadForm({ ...uploadForm, linkUrl: e.currentTarget.value })
            }
          />

          {uploadForm.category === "NOTES" && (
            <NumberInput
              label="Module Number"
              value={uploadForm.moduleNumber}
              onChange={(val) =>
                setUploadForm({ ...uploadForm, moduleNumber: Number(val) })
              }
              min={1}
            />
          )}

          {uploadForm.category === "PYQ" && (
            <Group grow>
              <Select
                label="Exam"
                data={["CAT1", "CAT2", "FAT"]}
                value={uploadForm.exam}
                onChange={(val) =>
                  setUploadForm({ ...uploadForm, exam: val || "CAT1" })
                }
              />
              <TextInput
                label="Exam Year"
                value={uploadForm.examYear}
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    examYear: e.currentTarget.value,
                  })
                }
              />
            </Group>
          )}

          {(uploadForm.category === "SYLLABUS" ||
            uploadForm.category === "OTHER") && (
            <Textarea
              label="Description"
              placeholder="Optional description"
              value={uploadForm.description}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  description: e.currentTarget.value,
                })
              }
            />
          )}

          <Button onClick={handleUpload} loading={uploading} fullWidth mt="md">
            Upload Resource
          </Button>
        </Stack>
      </Modal>
    </>
  );
}

function getEmbedUrl(url: string) {
  if (!url) return "";
  if (url.includes("drive.google.com") && url.includes("/view")) {
    return url.replace("/view", "/preview");
  }
  if (url.includes("youtube.com/watch")) {
    return url.replace("watch?v=", "embed/");
  }
  if (url.includes("youtu.be/")) {
    return url.replace("youtu.be/", "youtube.com/embed/");
  }
  return url;
}

function ResourceItemCard({
  title,
  type,
  onClick,
}: {
  title: string;
  type: string;
  onClick: () => void;
}) {
  const isPyq = type === "PYQ";
  const isSyllabus = type === "SYLLABUS";

  return (
    <Card
      padding="md"
      radius="md"
      withBorder
      onClick={onClick}
      className="resource-card"
    >
      <Group wrap="nowrap" align="start">
        <ThemeIcon
          size={36}
          radius="md"
          variant="light"
          color={isPyq ? "orange" : isSyllabus ? "grape" : "blue"}
        >
          {isPyq ? (
            <IconFolderOpen size={18} />
          ) : isSyllabus ? (
            <IconFileText size={18} />
          ) : (
            <IconBook size={18} />
          )}
        </ThemeIcon>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Text
            size="sm"
            fw={600}
            lineClamp={2}
            title={title}
            style={{ lineHeight: 1.4 }}
          >
            {title}
          </Text>
          <Group gap={6} mt={4}>
            <Badge
              size="xs"
              variant="dot"
              color={isPyq ? "orange" : isSyllabus ? "grape" : "blue"}
            >
              {type}
            </Badge>
          </Group>
        </div>

        <ActionIcon variant="subtle" color="gray" size="sm">
          <IconArrowRight size={14} />
        </ActionIcon>
      </Group>
      <style jsx global>{`
        .resource-card {
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: var(--mantine-color-body);
        }
        .resource-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--mantine-shadow-sm);
          border-color: var(--mantine-color-blue-3);
        }
      `}</style>
    </Card>
  );
}
