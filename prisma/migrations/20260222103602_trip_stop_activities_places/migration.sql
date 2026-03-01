-- CreateTable
CREATE TABLE "_TripStopPlaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_TripStopActivities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TripStopPlaces_AB_unique" ON "_TripStopPlaces"("A", "B");

-- CreateIndex
CREATE INDEX "_TripStopPlaces_B_index" ON "_TripStopPlaces"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TripStopActivities_AB_unique" ON "_TripStopActivities"("A", "B");

-- CreateIndex
CREATE INDEX "_TripStopActivities_B_index" ON "_TripStopActivities"("B");

-- AddForeignKey
ALTER TABLE "_TripStopPlaces" ADD CONSTRAINT "_TripStopPlaces_A_fkey" FOREIGN KEY ("A") REFERENCES "Place"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TripStopPlaces" ADD CONSTRAINT "_TripStopPlaces_B_fkey" FOREIGN KEY ("B") REFERENCES "TripStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TripStopActivities" ADD CONSTRAINT "_TripStopActivities_A_fkey" FOREIGN KEY ("A") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TripStopActivities" ADD CONSTRAINT "_TripStopActivities_B_fkey" FOREIGN KEY ("B") REFERENCES "TripStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
