import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Panel } from "primereact/panel";
import { OverlayPanel } from "primereact/overlaypanel";
import {
  InputNumber,
  InputNumberValueChangeEvent,
} from "primereact/inputnumber";
import { Button } from "primereact/button";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

interface ApiResponse {
  data: Artwork[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
}

const App: React.FC = () => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedArtworks, setSelectedArtworks] = useState<Artwork[]>([]);
  const [first, setFirst] = useState(0);
  const [rows] = useState(12);
  const [selectionCount, setSelectionCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const overlayPanelRef = useRef<OverlayPanel>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<1 | -1 | null>(null);

  const fetchArtworks = async (
    page: number,
    sortField?: string,
    sortOrder?: 1 | -1
  ) => {
    setLoading(true);
    try {
      let url = `https://api.artic.edu/api/v1/artworks?page=${page}&limit=${rows}&fields=id,title,place_of_origin,artist_display,inscriptions,date_start,date_end`;

      // Add sorting parameters if provided
      if (sortField && sortOrder) {
        url += `&sort=${sortOrder === 1 ? "" : "-"}${sortField}`;
      }

      const response = await fetch(url);
      const data: ApiResponse = await response.json();
      setArtworks(data.data);
      setTotalRecords(data.pagination.total);

      // Auto-select rows if needed
      if (selectionCount > 0) {
        const currentSelectedCount = selectedArtworks.length;
        const remainingToSelect = selectionCount - currentSelectedCount;

        if (remainingToSelect > 0) {
          const newSelections = [...selectedArtworks];
          data.data.forEach((artwork, index) => {
            if (
              index < remainingToSelect &&
              !newSelections.find((selected) => selected.id === artwork.id)
            ) {
              newSelections.push(artwork);
            }
          });
          setSelectedArtworks(newSelections);
        }
      }
    } catch (error) {
      console.error("Error fetching artworks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(1);
  }, []);

  const onPage = (event: { first: number; rows: number }) => {
    const page = Math.floor(event.first / rows) + 1;
    setCurrentPage(page);
    setFirst(event.first);
    fetchArtworks(page, sortField, sortOrder);
  };

  const handleSelectionSubmit = () => {
    setSelectedArtworks([]); // Clear existing selections
    fetchArtworks(1);
    overlayPanelRef.current?.hide();
  };

  const handleSort = (field: string) => {
    const newSortOrder = sortField === field ? (sortOrder === 1 ? -1 : 1) : 1;

    setSortField(field);
    setSortOrder(newSortOrder);
    fetchArtworks(currentPage, field, newSortOrder);
  };

  const headerTemplate = (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold">Selected Artworks</h2>
      <span className="text-sm">{selectedArtworks.length} items selected</span>
    </div>
  );

  const selectionPanel = () => {
    return (
      <Panel header={headerTemplate} className="mt-4">
        <div className="grid grid-cols-1 gap-4">
          {selectedArtworks.map((artwork) => (
            <div key={artwork.id} className="p-4 border rounded">
              <h3 className="font-bold">{artwork.title}</h3>
              <p className="text-sm text-gray-600">{artwork.artist_display}</p>
            </div>
          ))}
        </div>
      </Panel>
    );
  };

  const selectionHeaderTemplate = () => (
    <div className="flex items-center">
      <div className="mr-2">Select</div>
      <Button
        icon="pi pi-chevron-down"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          overlayPanelRef.current?.toggle(e)
        }
        className="p-button-text p-button-sm"
      />
      <OverlayPanel ref={overlayPanelRef}>
        <div className="p-4">
          <div className="mb-3">Select number of rows:</div>
          <div className="flex items-center gap-3">
            <InputNumber
              value={selectionCount}
              onValueChange={(e: InputNumberValueChangeEvent) =>
                setSelectionCount(e.value || 0)
              }
              min={0}
              max={totalRecords}
            />
            <Button label="Submit" onClick={handleSelectionSubmit} />
          </div>
        </div>
      </OverlayPanel>
    </div>
  );

  const onSelectionChange = (e: any) => {
    // If "Select All" is clicked, add all artworks to the selection.
    const selectedRows = e.value;
    setSelectedArtworks(selectedRows);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Art Institute of Chicago Gallery</h1>
        <div className="flex items-center">
          <div className="mr-2">Select</div>
          <Button
            icon="pi pi-chevron-down"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
              overlayPanelRef.current?.toggle(e)
            }
            className="p-button-text p-button-sm"
          />
          <OverlayPanel ref={overlayPanelRef}>
            <div className="p-4">
              <div className="mb-3">Select number of rows:</div>
              <div className="flex items-center gap-3">
                <InputNumber
                  value={selectionCount}
                  onValueChange={(e: InputNumberValueChangeEvent) =>
                    setSelectionCount(e.value || 0)
                  }
                  min={0}
                  max={totalRecords}
                />
                <Button label="Submit" onClick={handleSelectionSubmit} />
              </div>
            </div>
          </OverlayPanel>
        </div>
      </div>

      <DataTable
        value={artworks}
        lazy
        dataKey="id"
        paginator
        first={first}
        rows={rows}
        totalRecords={totalRecords}
        onPage={onPage}
        loading={loading}
        className="p-datatable-sm"
        selectionMode="checkbox"
        selection={selectedArtworks}
        onSelectionChange={onSelectionChange}
        tableStyle={{ minWidth: "50rem" }}
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
    </div>
  );
};

export default App;
